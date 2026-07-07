"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePricing(formData: FormData) {
  const supabase = createClient();

  const fields = [
    "small_window_exterior_price",
    "small_window_interior_price",
    "medium_window_exterior_price",
    "medium_window_interior_price",
    "large_window_exterior_price",
    "large_window_interior_price",
    "tier_plus_tracks_fee",
    "tier_premium_fee",
    "screens_fee",
    "gutter_price_per_linear_foot",
    "gutter_debris_light_multiplier",
    "gutter_debris_moderate_multiplier",
    "gutter_debris_heavy_multiplier",
    "house_wash_price_per_sqft",
    "house_wash_dirtiness_light_multiplier",
    "house_wash_dirtiness_moderate_multiplier",
    "house_wash_dirtiness_heavy_multiplier",
    "story_surcharge_per_level",
    "minimum_job_price",
  ] as const;

  const update: Record<string, number> = {};
  for (const field of fields) {
    update[field] = Number(formData.get(field));
  }

  await supabase
    .from("pricing_config")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", 1);

  revalidatePath("/owner/pricing");
}
