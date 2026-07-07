import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";
import { Button } from "@/components/Button";

export default async function ClientDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("client_id", user!.id)
    .order("created_at", { ascending: false });

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
