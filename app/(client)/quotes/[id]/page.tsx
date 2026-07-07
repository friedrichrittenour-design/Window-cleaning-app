import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";
import { SERVICE_TIERS } from "@/lib/pricing";

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
              label="Cleaning"
              value={quote.cleaning_type === "interior_exterior" ? "Interior + Exterior" : "Exterior Only"}
            />
            <Row label="Service Tier" value={tier?.label ?? quote.service_tier} />
            <Row label="Screen Cleaning" value={quote.add_screens ? "Yes" : "No"} />
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
          {quote.final_price && (
            <p className="text-sm font-bold text-navy">
              Final confirmed price: ${quote.final_price}
            </p>
          )}
          {quote.ai_analysis?.notes && (
            <p className="text-xs text-[#10102a] mt-4">
              {quote.ai_analysis.notes}
            </p>
          )}
        </div>
      </div>
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
