import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";
import { Button } from "@/components/Button";
import { REFERRAL_BONUS_AMOUNT } from "@/lib/referrals";

export default async function ClientDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: quotes }, { data: profile }, { data: creditRows }, { data: unpaidInvoices }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("*")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("referral_code").eq("id", user!.id).single(),
      supabase.from("credits").select("amount").eq("profile_id", user!.id),
      supabase.from("invoices").select("amount_due").eq("client_id", user!.id).eq("status", "unpaid"),
    ]);

  const creditBalance = (creditRows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const outstandingBalance = (unpaidInvoices ?? []).reduce(
    (sum, row) => sum + Number(row.amount_due),
    0
  );
  const host = headers().get("host");
  const referralLink = profile?.referral_code
    ? `${host ? `https://${host}` : ""}/signup?ref=${profile.referral_code}`
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display uppercase text-2xl text-navy">
          My Quotes
        </h1>
        <Button href="/quotes/new" className="!px-5 !py-2.5 !text-xs">
          + New Quote
        </Button>
      </div>

      <div className="bg-green-neon border-[3px] border-black shadow-hard p-6 mb-8 grid sm:grid-cols-3 gap-4">
        <div>
          <h2 className="font-display uppercase text-sm text-navy mb-1">
            Your Credit Balance
          </h2>
          <p className="text-2xl font-display text-navy">${creditBalance}</p>
        </div>
        <div>
          <h2 className="font-display uppercase text-sm text-navy mb-1">
            Outstanding Balance
          </h2>
          <p className="text-2xl font-display text-navy">${outstandingBalance}</p>
        </div>
        <div>
          <h2 className="font-display uppercase text-sm text-navy mb-1">
            Give ${REFERRAL_BONUS_AMOUNT}, Get ${REFERRAL_BONUS_AMOUNT}
          </h2>
          {referralLink ? (
            <>
              <p className="text-xs text-[#10102a] mb-1">
                Share your code — you both get ${REFERRAL_BONUS_AMOUNT} off
                once their first job is confirmed.
              </p>
              <p className="font-bold text-navy text-sm break-all">
                {referralLink}
              </p>
            </>
          ) : (
            <p className="text-xs text-[#10102a]">
              Your referral code will appear here shortly.
            </p>
          )}
        </div>
      </div>

      {!quotes || quotes.length === 0 ? (
        <div className="border-[3px] border-black shadow-hard bg-white p-10 text-center">
          <p className="mb-4">
            You haven&apos;t requested a quote yet. Upload a photo of your
            windows to get an instant estimate.
          </p>
          <Button href="/quotes/new">Get an Instant Quote</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((q) => (
            <Link
              key={q.id}
              href={`/quotes/${q.id}`}
              className="block border-[3px] border-black shadow-hard-sm bg-white p-5 hover:shadow-hard hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-navy">
                    {q.address || "Property quote"}
                  </p>
                  <p className="text-xs text-[#4a5875] uppercase">
                    {q.property_type} · {q.service_tier.replace("_", " ")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {q.estimated_low && (
                    <span className="font-bold text-electric-dark">
                      ${q.estimated_low}–${q.estimated_high}
                    </span>
                  )}
                  <QuoteStatusBadge status={q.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
