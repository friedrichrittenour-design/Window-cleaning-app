# Superior Window Washing

A Next.js app for a window cleaning business: clients request quotes by
uploading photos of their property, an AI vision model estimates the windows
visible, and an instant priced quote is generated. Business owners review
quotes, confirm final pricing, and manage the pricing table.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase**: Postgres, Auth (email/password), Storage
- **Anthropic API**: vision-based photo analysis
- **Stripe**: invoice payments (Checkout + webhooks)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com).

3. **Run the schema**: open the SQL editor in your Supabase project and run
   the contents of [`supabase/schema.sql`](./supabase/schema.sql). This
   creates the `profiles`, `quotes`, `quote_photos`, `pricing_config`,
   `availability_rules`, `availability_blocks`, `appointments`, `credits`,
   and `invoices` tables along with row-level security policies.

4. **Create the photo storage bucket**: in Supabase Storage, create a new
   **private** bucket named `quote-photos` (or run the commented-out snippet
   at the bottom of `schema.sql`).

5. **Get an Anthropic API key** from the
   [Anthropic Console](https://console.anthropic.com) for the photo analysis
   feature.

6. **Set up Stripe**: create a [Stripe](https://dashboard.stripe.com)
   account, grab your secret key from **Developers → API keys**, then add a
   webhook endpoint pointing at `https://<your-domain>/api/webhooks/stripe`
   listening for the `checkout.session.completed` event, and copy its
   signing secret.

7. **Configure environment variables**: copy `.env.local.example` to
   `.env.local` and fill in your Supabase URL/keys, Anthropic API key, and
   Stripe keys.

   ```bash
   cp .env.local.example .env.local
   ```

8. **Run the dev server**

   ```bash
   npm run dev
   ```

## How pricing works

All quote pricing logic lives in [`lib/pricing.ts`](./lib/pricing.ts) as a
pure `calculateQuote()` function — no external dependencies, easy to unit
test or hand-edit. Clients can request any combination of the three
services below in one quote; each is priced independently and summed.
Default rates:

| Item | Default |
| --- | --- |
| Small window | $5 exterior-only, $14 interior+exterior |
| Standard / double-hung / bay window | $7 exterior-only, $18 interior+exterior |
| Large window | $18 exterior-only, $46 interior+exterior |
| Basic tier | included |
| Plus Tracks tier | +$20 |
| Premium tier (debris + hard water + tracks) | +$45 |
| Screen cleaning | $3 per screen (AI-counted) |
| Gutter cleaning | $1.50 per linear foot × debris multiplier (light 1×, moderate 1.3×, heavy 1.6×) |
| House washing | $0.20 per sq ft × dirtiness multiplier (light 1×, moderate 1.25×, heavy 1.5×) |
| Extra story surcharge | $15 per story above the 1st (once per job) |
| Minimum job price | $150 (once per job) |

Business owners can adjust every one of these rates live from
`/owner/pricing`, which reads/writes the `pricing_config` table. The photo
analysis API route falls back to the constants in `lib/pricing.ts` if that
table is ever empty.

## How the auto-quote flow works

1. A client fills out the form at `/quotes/new`: which service(s) they want
   (window cleaning, gutter cleaning, house washing), property type,
   address, stories, and — if window cleaning is selected — cleaning type,
   service tier, and a screen-cleaning add-on, plus one or more photos of
   the property.
2. Photos upload to the private `quote-photos` Storage bucket, and a `quotes`
   row is created with `status = 'pending_analysis'`.
3. `POST /api/quotes/analyze` downloads the photos server-side and sends them
   to the Anthropic API with a prompt scoped to the selected services —
   window/screen counts, gutter linear footage + debris level, and/or house
   wall square footage + dirtiness — then runs `calculateQuote()` with those
   estimates plus the client's selections.
4. The `quotes` row is updated with the AI's raw output, a combined
   estimated price range, a per-service price breakdown, and
   `status = 'quoted'`.
5. The business owner reviews the quote (with photos, the AI's notes, and
   the per-service breakdown) at `/owner/quotes/[id]`, and can override the
   price, add notes, and mark it `confirmed` or `declined`.
6. Once confirmed, the client books a visit at `/quotes/[id]/schedule` by
   picking an open date/time computed from the owner's availability (see
   below).

If AI analysis fails twice (bad response, parsing error, etc.), the quote is
left in `pending_analysis` with an error note in `ai_analysis` so the owner
can price it manually.

## How scheduling works

- The owner sets recurring weekly hours (e.g. Mon–Fri 9am–5pm) at
  `/owner/availability`, and can block off specific dates (vacation, fully
  booked, etc.) on the same page.
- `GET /api/availability/slots?date=YYYY-MM-DD` computes open appointment
  slots for that date using [`lib/scheduling.ts`](./lib/scheduling.ts)'s
  pure `getAvailableSlots()` function — weekly hours minus blocked ranges
  minus already-booked appointments, stepped at 1-hour intervals for
  2-hour appointment slots (both configurable constants in that file).
- Once a quote is `confirmed`, the client picks a date on the calendar at
  `/quotes/[id]/schedule` and books an open time slot, which re-validates
  the slot is still free before inserting into `appointments` (avoiding a
  double-booking race).
- The owner sees all booked visits on a month calendar at `/owner/calendar`.

## How the referral program works

- Every client gets a unique referral code (generated at signup,
  [`lib/referrals.ts`](./lib/referrals.ts)) and a shareable
  `/signup?ref=CODE` link, both shown on `/dashboard`.
- A new client can enter someone's referral code at signup, which links
  their profile via `profiles.referred_by`.
- Credit is only granted once the referred client's **first job is
  confirmed** by the owner (`app/(owner)/owner/quotes/[id]/actions.ts`) —
  both the referrer and the referred client get $20, recorded as rows in
  the `credits` ledger table. A partial unique index guarantees the
  referred bonus can only ever be granted once per client, even if they
  get multiple jobs confirmed later.
- The owner can redeem a client's available credit balance against any
  quote from the same review form, via a **Credit to Apply** field that
  defaults to their full available balance (capped at the final price).
  Redemptions are recorded as negative ledger entries and are
  re-computed idempotently each time the form is saved.
- Clients see any credit applied and their remaining amount due on their
  quote detail page.

## How payments & invoicing work

- The moment the owner sets `status = 'confirmed'` with a final price on a
  quote (`app/(owner)/owner/quotes/[id]/actions.ts`), an `invoices` row is
  created automatically for the amount due (final price minus any credit
  applied, via `lib/invoices.ts`'s `calculateAmountDue()`). If credit fully
  covers the price, the invoice is marked `paid` immediately with no
  payment step needed.
- Clients see their invoice and a **Pay Now** button on `/quotes/[id]`
  (unpaid invoices only). That button calls
  `POST /api/invoices/checkout`, which creates a Stripe Checkout Session
  for the amount due and redirects the client to Stripe's hosted payment
  page.
- `POST /api/webhooks/stripe` verifies the webhook signature and, on
  `checkout.session.completed`, marks the matching invoice `paid` with
  `payment_method: 'stripe'`.
- The owner can also collect payment outside the app (cash, check, Venmo)
  and click **Mark as Paid** on `/owner/invoices` or directly on a quote's
  review page — recorded as `payment_method: 'manual'`.
- Editing a confirmed quote's price or credit later re-syncs its invoice's
  `amount_due`, as long as it hasn't been paid or voided yet.

## Notes on this environment

This app was scaffolded without a live Supabase project or Anthropic API
key — both must be supplied (steps 2–6 above) before signup, quote
submission, or AI analysis will work end-to-end. `npm run build` and the
public landing page (`/`) work without any of those credentials.
