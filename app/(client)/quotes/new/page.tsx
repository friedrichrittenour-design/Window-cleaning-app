"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader } from "@/components/PhotoUploader";
import { SERVICE_TIERS, type ServiceTier } from "@/lib/pricing";

export default function NewQuotePage() {
  const router = useRouter();
  const supabase = createClient();

  const [files, setFiles] = useState<File[]>([]);
  const [propertyType, setPropertyType] = useState<"residential" | "commercial">(
    "residential"
  );
  const [address, setAddress] = useState("");
  const [stories, setStories] = useState(1);
  const [cleaningType, setCleaningType] = useState<
    "exterior" | "interior_exterior"
  >("exterior");
  const [serviceTier, setServiceTier] = useState<ServiceTier>("basic");
  const [addScreens, setAddScreens] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please add at least one photo.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setSubmitting(false);
      return;
    }

    const { data: quote, error: insertError } = await supabase
      .from("quotes")
      .insert({
        client_id: user.id,
        property_type: propertyType,
        address,
        stories,
        cleaning_type: cleaningType,
        service_tier: serviceTier,
        add_screens: addScreens,
        status: "pending_analysis",
      })
      .select()
      .single();

    if (insertError || !quote) {
      setError(insertError?.message ?? "Could not create quote.");
      setSubmitting(false);
      return;
    }

    for (const file of files) {
      const path = `${quote.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("quote-photos")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        setSubmitting(false);
        return;
      }

      await supabase.from("quote_photos").insert({
        quote_id: quote.id,
        storage_path: path,
      });
    }

    await fetch("/api/quotes/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: quote.id }),
    });

    router.push(`/quotes/${quote.id}`);
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display uppercase text-2xl text-navy mb-6">
        New Quote Request
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 bg-white border-[3px] border-black shadow-hard p-8"
      >
        <PhotoUploader files={files} onChange={setFiles} />

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Property Type
            </span>
            <select
              value={propertyType}
              onChange={(e) =>
                setPropertyType(e.target.value as "residential" | "commercial")
              }
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Stories
            </span>
            <input
              type="number"
              min={1}
              max={10}
              value={stories}
              onChange={(e) => setStories(Number(e.target.value))}
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase text-navy">
            Address
          </span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St"
            className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
          />
        </label>

        <div>
          <span className="text-xs font-bold uppercase text-navy block mb-2">
            Cleaning Type
          </span>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["exterior", "Exterior Only"],
                ["interior_exterior", "Interior + Exterior"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCleaningType(value)}
                className={`border-[3px] border-black py-2.5 font-bold uppercase text-xs shadow-hard-sm ${
                  cleaningType === value ? "bg-electric" : "bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-bold uppercase text-navy block mb-2">
            Service Tier
          </span>
          <div className="grid gap-3">
            {SERVICE_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setServiceTier(tier.id)}
                className={`text-left border-[3px] border-black p-4 shadow-hard-sm ${
                  serviceTier === tier.id ? "bg-yellow-neon" : "bg-white"
                }`}
              >
                <span className="font-bold uppercase text-sm text-navy block">
                  {tier.label}
                </span>
                <span className="text-xs text-[#4a5875]">
                  {tier.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 font-bold text-sm uppercase text-navy">
          <input
            type="checkbox"
            checked={addScreens}
            onChange={(e) => setAddScreens(e.target.checked)}
            className="w-5 h-5"
          />
          Add screen cleaning (+add-on)
        </label>

        {error && <p className="text-sm font-bold text-pink-neon">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-gradient-to-br from-electric to-pink-neon text-black font-bold uppercase text-sm border-[3px] border-black shadow-hard py-3.5 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Get My Instant Quote"}
        </button>
      </form>
    </div>
  );
}
