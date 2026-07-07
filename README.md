# Crystal Clear Window Cleaning

A Next.js app for a window cleaning business: clients request quotes by
uploading photos of their property, an AI vision model estimates the windows
visible, and an instant priced quote is generated. Business owners review
quotes, confirm final pricing, and manage the pricing table.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase**: Postgres, Auth (email/password), Storage
- **Anthropic API**: vision-based photo analysis

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com).

3. **Run the schema**: open the SQL editor in your Supabase project and run
   the contents of [`supabase/schema.sql`](./supabase/schema.sql). This
   creates the `profiles`, `quotes`, `quote_photos`, and `pricing_config`
   tables along with row-level security policies.

4. **Create the photo storage bucket**: in Supabase Storage, create a new
   **private** bucket named `quote-photos` (or run the commented-out snippet
   at the bottom of `schema.sql`).

5. **Get an Anthropic API key** from the
   [Anthropic Console](https://console.anthropic.com) for the photo analysis
   feature.

6. **Configure environment variables**: copy `.env.local.example` to
   `.env.local` and fill in your Supabase URL/keys and Anthropic API key.

   ```bash
   cp .env.local.example .env.local
   ```

7. **Run the dev server**

   ```bash
   npm run dev
   ```

## How pricing works

All quote pricing logic lives in [`lib/pricing.ts`](./lib/pricing.ts) as a
pure `calculateQuote()` function — no external dependencies, easy to unit
test or hand-edit. Default rates:

| Item | Default |
| --- | --- |
| Small window | $8 |
| Medium window | $12 |
| Large window | $18 |
| Interior + exterior | 1.6× the exterior total |
| Extra story surcharge | $15 per story above the 1st |
| Basic tier | included |
| Plus Tracks tier | +$20 |
| Premium tier (debris + hard water + tracks) | +$45 |
| Screen cleaning add-on | +$25 |
| Minimum job price | $89 |

Business owners can adjust every one of these rates live from
`/owner/pricing`, which reads/writes the `pricing_config` table. The photo
analysis API route falls back to the constants in `lib/pricing.ts` if that
table is ever empty.

## How the auto-quote flow works

1. A client fills out the form at `/quotes/new`: property type, address,
   stories, cleaning type, service tier, and a screen-cleaning add-on, plus
   one or more photos of the property.
2. Photos upload to the private `quote-photos` Storage bucket, and a `quotes`
   row is created with `status = 'pending_analysis'`.
3. `POST /api/quotes/analyze` downloads the photos server-side, sends them to
   the Anthropic API with a prompt asking for a strict-JSON count of
   small/medium/large windows, then runs `calculateQuote()` with that count
   plus the client's selections.
4. The `quotes` row is updated with the AI's raw output, an estimated price
   range, and `status = 'quoted'`.
5. The business owner reviews the quote (with photos and the AI's notes) at
   `/owner/quotes/[id]`, and can override the price, add notes, and mark it
   `confirmed` or `declined`.

If AI analysis fails twice (bad response, parsing error, etc.), the quote is
left in `pending_analysis` with an error note in `ai_analysis` so the owner
can price it manually.

## Notes on this environment

This app was scaffolded without a live Supabase project or Anthropic API
key — both must be supplied (steps 2–6 above) before signup, quote
submission, or AI analysis will work end-to-end. `npm run build` and the
public landing page (`/`) work without any of those credentials.
