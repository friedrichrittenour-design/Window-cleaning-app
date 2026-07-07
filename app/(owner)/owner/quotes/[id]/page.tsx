import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";
import { SERVICE_TIERS } from "@/lib/pricing";
import { updateQuote } from "./actions";

export default async function OwnerQuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, profiles(full_name, phone)")
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
        <div>
          <h1 className="font-display uppercase text-2xl text-navy">
            {quote.profiles?.full_name ?? "Client"}
          </h1>
          <p className="text-sm text-[#4a5875]">
            {quote.address} {quote.profiles?.phone && `· ${quote.profiles.phone}`}
          </p>
        </div>
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
          <dl className="grid gap-2 text-sm mb-6">
            <Row label="Property Type" value={quote.property_type} />
            <Row label="Stories" value={String(quote.stories)} />
            <Row
              label="Cleaning"
              value={quote.cleaning_type === "interior_exterior" ? "Interior + Exterior" : "Exterior Only"}
            />
            <Row label="Service Tier" value={tier?.label ?? quote.service_tier} />
            <Row label="Screen Cleaning" value={quote.add_screens ? "Yes" : "No"} />
            <Row
              label="AI Estimate"
              value={quote.estimated_low ? `$${quote.estimated_low}–$${quote.estimated_high}` : "Pending"}
            />
          </dl>

          {quote.ai_analysis && (
            <div className="text-xs bg-[#f4fbff] border-2 border-navy p-3">
              <p className="font-bold uppercase mb-1">AI Analysis</p>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(quote.ai_analysis, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <form
          action={updateQuote}
          className="bg-white border-[3px] border-black shadow-hard p-6 grid gap-4"
        >
          <input type="hidden" name="quoteId" value={quote.id} />
          <h2 className="font-display uppercase text-lg text-navy">
            Owner Review
          </h2>

          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Final Price
            </span>
            <input
              name="finalPrice"
              type="number"
              step="0.01"
              defaultValue={quote.final_price ?? quote.estimated_low ?? ""}
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Status
            </span>
            <select
              name="status"
              defaultValue={quote.status}
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            >
              <option value="quoted">Quoted</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Notes
            </span>
            <textarea
              name="ownerNotes"
              rows={3}
              defaultValue={quote.owner_notes ?? ""}
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>

          <button
            type="submit"
            className="bg-gradient-to-br from-electric to-pink-neon text-black font-bold uppercase text-sm border-[3px] border-black shadow-hard py-3"
          >
            Save
          </button>
        </form>
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
