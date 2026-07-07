import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";
import { Button } from "@/components/Button";
import { SERVICES, SERVICE_TIERS, type ServiceId } from "@/lib/pricing";

export default async function ClientQuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!quote) notFound();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("quote_id", quote.id)
    .eq("status", "scheduled")
    .maybeSingle();

  const { data: photos } = await supabase
    .from("quote_photos")
    .select("*")
    .eq("quote_id", quote.id);

  const signedPhotos = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("quote-photos")
        .createSignedUrl(photo.storage_path, 60 * 60);
      return { id: photo.id, url: data?.signedUrl };
    })
  );

  const tier = SERVICE_TIERS.find((t) => t.id === quote.service_tier);
  const services: ServiceId[] = quote.services ?? [];
  const windowsSelected = services.includes("window_cleaning");
  const breakdown: Partial<Record<ServiceId, { subtotal: number }>> =
    quote.service_breakdown ?? {};
  const notes: string[] = services
    .map((s) => quote.ai_analysis?.[s]?.notes)
    .filter(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display uppercase text-2xl text-navy">
          {quote.address || "Property Quote"}
        </h1>
        <QuoteStatusBadge status={quote.status} />
      </div>

      {signedPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {signedPhotos.map(
            (p) =>
              p.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt="Property photo"
                  className="w-full h-32 object-cover border-2 border-black shadow-hard-sm"
                />
              )
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border-[3px] border-black shadow-hard p-6">
          <h2 className="font-display uppercase text-lg text-navy mb-4">
            Request Details
          </h2>
          <dl className="grid gap-2 text-sm">
            <Row label="Property Type" value={quote.property_type} />
            <Row label="Stories" value={String(quote.stories)} />
            <Row
              label="Services"
              value={services
                .map((s) => SERVICES.find((svc) => svc.id === s)?.label ?? s)
                .join(", ")}
            />
            {windowsSelected && (
              <>
                <Row
                  label="Window Cleaning"
                  value={
                    quote.cleaning_type === "interior_exterior"
                      ? "Interior + Exterior"
                      : "Exterior Only"
                  }
                />
                <Row label="Window Service Tier" value={tier?.label ?? quote.service_tier} />
                <Row label="Screen Cleaning" value={quote.add_screens ? "Yes" : "No"} />
              </>
            )}
          </dl>
        </div>

        <div className="bg-yellow-neon border-[3px] border-black shadow-hard p-6">
          <h2 className="font-display uppercase text-lg text-navy mb-4">
            Estimated Price
          </h2>
          {quote.status === "pending_analysis" && (
            <p className="text-sm text-[#10102a]">
              We&apos;re analyzing your photos — check back in a moment.
            </p>
          )}
          {quote.estimated_low && (
            <p className="text-3xl font-display text-navy mb-2">
              ${quote.estimated_low}–${quote.estimated_high}
            </p>
          )}

          {Object.keys(breakdown).length > 0 && (
            <dl className="grid gap-1 text-xs mb-3">
              {(Object.keys(breakdown) as ServiceId[]).map((id) => (
                <div key={id} className="flex justify-between">
                  <dt className="text-[#10102a]">
                    {SERVICES.find((s) => s.id === id)?.label ?? id}
                  </dt>
                  <dd className="font-bold text-navy">
                    ~${Math.round(breakdown[id]!.subtotal)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {quote.final_price && (
            <p className="text-sm font-bold text-navy">
              Final confirmed price: ${quote.final_price}
            </p>
          )}
          {notes.length > 0 && (
            <p className="text-xs text-[#10102a] mt-4">{notes.join(" ")}</p>
          )}
        </div>
      </div>

      {quote.status === "confirmed" && (
        <div className="bg-green-neon border-[3px] border-black shadow-hard p-6 mt-6">
          <h2 className="font-display uppercase text-lg text-navy mb-2">
            {appointment ? "Your Visit Is Scheduled" : "Ready to Book"}
          </h2>
          {appointment ? (
            <p className="text-sm font-bold text-navy">
              {new Date(appointment.start_at).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {new Date(appointment.start_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : (
            <>
              <p className="text-sm text-[#10102a] mb-4">
                Your quote is confirmed — pick a date and time for your visit.
              </p>
              <Button
                href={`/quotes/${quote.id}/schedule`}
                variant="primary"
                className="!bg-navy !text-white"
              >
                Schedule This Job
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-dashed border-[#d6e2f5] pb-2">
      <dt className="text-[#4a5875] uppercase text-xs">{label}</dt>
      <dd className="font-bold text-navy">{value}</dd>
    </div>
  );
}
