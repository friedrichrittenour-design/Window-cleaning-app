import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";

export default async function OwnerDashboardPage() {
  const supabase = createClient();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display uppercase text-2xl text-navy mb-6">
        All Quote Requests
      </h1>

      {!quotes || quotes.length === 0 ? (
        <div className="border-[3px] border-black shadow-hard bg-white p-10 text-center">
          <p>No quote requests yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((q: any) => (
            <Link
              key={q.id}
              href={`/owner/quotes/${q.id}`}
              className="block border-[3px] border-black shadow-hard-sm bg-white p-5 hover:shadow-hard hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-navy">
                    {q.profiles?.full_name ?? "Client"} —{" "}
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
