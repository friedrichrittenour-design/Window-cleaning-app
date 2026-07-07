import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PRICING } from "@/lib/pricing";
import { updatePricing } from "./actions";

const FIELDS: { name: string; label: string; step?: string }[] = [
  { name: "small_window_price", label: "Small Window ($)" },
  { name: "medium_window_price", label: "Medium Window ($)" },
  { name: "large_window_price", label: "Large Window ($)" },
  { name: "interior_multiplier", label: "Interior+Exterior Multiplier", step: "0.1" },
  { name: "story_surcharge_per_level", label: "Surcharge per Story Above 1st ($)" },
  { name: "tier_plus_tracks_fee", label: "\"Plus Tracks\" Tier Fee ($)" },
  { name: "tier_premium_fee", label: "\"Premium\" Tier Fee ($)" },
  { name: "screens_fee", label: "Screen Cleaning Add-on ($)" },
  { name: "minimum_job_price", label: "Minimum Job Price ($)" },
];

export default async function OwnerPricingPage() {
  const supabase = createClient();

  const { data: pricing } = await supabase
    .from("pricing_config")
    .select("*")
    .eq("id", 1)
    .single();

  const fallback = {
    small_window_price: DEFAULT_PRICING.small,
    medium_window_price: DEFAULT_PRICING.medium,
    large_window_price: DEFAULT_PRICING.large,
    interior_multiplier: DEFAULT_PRICING.interiorMultiplier,
    story_surcharge_per_level: DEFAULT_PRICING.storySurchargePerLevel,
    tier_plus_tracks_fee: DEFAULT_PRICING.tiers.plus_tracks,
    tier_premium_fee: DEFAULT_PRICING.tiers.premium,
    screens_fee: DEFAULT_PRICING.screensFee,
    minimum_job_price: DEFAULT_PRICING.minimumJobPrice,
  };

  const values: Record<string, number> = { ...fallback, ...(pricing ?? {}) };

  return (
    <div>
      <h1 className="font-display uppercase text-2xl text-navy mb-2">
        Pricing Configuration
      </h1>
      <p className="text-sm text-[#4a5875] mb-6">
        These rates drive every automatic quote. Changes apply immediately to
        new quote requests.
      </p>

      <form
        action={updatePricing}
        className="bg-white border-[3px] border-black shadow-hard p-8 grid sm:grid-cols-2 gap-5 max-w-2xl"
      >
        {FIELDS.map((field) => (
          <label key={field.name} className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              {field.label}
            </span>
            <input
              name={field.name}
              type="number"
              step={field.step ?? "1"}
              defaultValue={values[field.name]}
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>
        ))}

        <button
          type="submit"
          className="sm:col-span-2 bg-gradient-to-br from-electric to-pink-neon text-black font-bold uppercase text-sm border-[3px] border-black shadow-hard py-3.5"
        >
          Save Pricing
        </button>
      </form>
    </div>
  );
}
