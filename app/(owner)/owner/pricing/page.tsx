import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PRICING } from "@/lib/pricing";
import { updatePricing } from "./actions";

const FIELD_GROUPS: { title: string; fields: { name: string; label: string; step?: string }[] }[] = [
  {
    title: "Window Cleaning",
    fields: [
      { name: "small_window_price", label: "Small Window ($)" },
      { name: "medium_window_price", label: "Medium Window ($)" },
      { name: "large_window_price", label: "Large Window ($)" },
      { name: "interior_multiplier", label: "Interior+Exterior Multiplier", step: "0.1" },
      { name: "tier_plus_tracks_fee", label: "\"Plus Tracks\" Tier Fee ($)" },
      { name: "tier_premium_fee", label: "\"Premium\" Tier Fee ($)" },
      { name: "screens_fee", label: "Screen Cleaning Add-on ($)" },
    ],
  },
  {
    title: "Gutter Cleaning",
    fields: [
      { name: "gutter_price_per_linear_foot", label: "Price per Linear Foot ($)", step: "0.1" },
      { name: "gutter_debris_light_multiplier", label: "Light Debris Multiplier", step: "0.05" },
      { name: "gutter_debris_moderate_multiplier", label: "Moderate Debris Multiplier", step: "0.05" },
      { name: "gutter_debris_heavy_multiplier", label: "Heavy Debris Multiplier", step: "0.05" },
    ],
  },
  {
    title: "House Washing",
    fields: [
      { name: "house_wash_price_per_sqft", label: "Price per Sq Ft ($)", step: "0.01" },
      { name: "house_wash_dirtiness_light_multiplier", label: "Light Dirtiness Multiplier", step: "0.05" },
      { name: "house_wash_dirtiness_moderate_multiplier", label: "Moderate Dirtiness Multiplier", step: "0.05" },
      { name: "house_wash_dirtiness_heavy_multiplier", label: "Heavy Dirtiness Multiplier", step: "0.05" },
    ],
  },
  {
    title: "Shared (Job-Level)",
    fields: [
      { name: "story_surcharge_per_level", label: "Surcharge per Story Above 1st ($)" },
      { name: "minimum_job_price", label: "Minimum Job Price ($)" },
    ],
  },
];

export default async function OwnerPricingPage() {
  const supabase = createClient();

  const { data: pricing } = await supabase
    .from("pricing_config")
    .select("*")
    .eq("id", 1)
    .single();

  const fallback = {
    small_window_price: DEFAULT_PRICING.windowCleaning.small,
    medium_window_price: DEFAULT_PRICING.windowCleaning.medium,
    large_window_price: DEFAULT_PRICING.windowCleaning.large,
    interior_multiplier: DEFAULT_PRICING.windowCleaning.interiorMultiplier,
    tier_plus_tracks_fee: DEFAULT_PRICING.windowCleaning.tiers.plus_tracks,
    tier_premium_fee: DEFAULT_PRICING.windowCleaning.tiers.premium,
    screens_fee: DEFAULT_PRICING.windowCleaning.screensFee,
    gutter_price_per_linear_foot: DEFAULT_PRICING.gutterCleaning.pricePerLinearFoot,
    gutter_debris_light_multiplier: DEFAULT_PRICING.gutterCleaning.debrisMultipliers.light,
    gutter_debris_moderate_multiplier: DEFAULT_PRICING.gutterCleaning.debrisMultipliers.moderate,
    gutter_debris_heavy_multiplier: DEFAULT_PRICING.gutterCleaning.debrisMultipliers.heavy,
    house_wash_price_per_sqft: DEFAULT_PRICING.houseWashing.pricePerSqFt,
    house_wash_dirtiness_light_multiplier: DEFAULT_PRICING.houseWashing.dirtinessMultipliers.light,
    house_wash_dirtiness_moderate_multiplier: DEFAULT_PRICING.houseWashing.dirtinessMultipliers.moderate,
    house_wash_dirtiness_heavy_multiplier: DEFAULT_PRICING.houseWashing.dirtinessMultipliers.heavy,
    story_surcharge_per_level: DEFAULT_PRICING.storySurchargePerLevel,
    minimum_job_price: DEFAULT_PRICING.minimumJobPrice,
  };

  const values: Record<string, number> = { ...fallback, ...(pricing ?? {}) };

  return (
    <div>
      <h1 className="font-display uppercase text-2xl text-navy mb-2">
        Pricing Configuration
      </h1>
      <p className="text-sm text-[#4a5875] mb-6">
        These rates drive every automatic quote across all three services.
        Changes apply immediately to new quote requests.
      </p>

      <form
        action={updatePricing}
        className="bg-white border-[3px] border-black shadow-hard p-8 grid gap-8 max-w-2xl"
      >
        {FIELD_GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="font-display uppercase text-sm text-pink-neon mb-3">
              {group.title}
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {group.fields.map((field) => (
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
            </div>
          </div>
        ))}

        <button
          type="submit"
          className="bg-gradient-to-br from-electric to-pink-neon text-black font-bold uppercase text-sm border-[3px] border-black shadow-hard py-3.5"
        >
          Save Pricing
        </button>
      </form>
    </div>
  );
}
