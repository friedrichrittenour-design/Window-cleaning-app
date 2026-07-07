"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePricing(formData: FormData) {
  const supabase = createClient();

  const fields = [
    "small_window_price",
    "medium_window_price",
    "large_window_price",
    "interior_multiplier",
    "story_surcharge_per_level",
    "tier_plus_tracks_fee",
    "tier_premium_fee",
    "screens_fee",
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
