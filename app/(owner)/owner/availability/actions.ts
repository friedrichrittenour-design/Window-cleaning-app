"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export async function saveAvailability(formData: FormData) {
  const supabase = createClient();

  const rows = DAYS.filter((day) => formData.get(`day_${day}_enabled`) === "on").map(
    (day) => ({
      day_of_week: day,
      start_time: String(formData.get(`day_${day}_start`)),
      end_time: String(formData.get(`day_${day}_end`)),
    })
  );

  await supabase.from("availability_rules").delete().gte("day_of_week", 0);

  if (rows.length > 0) {
    await supabase.from("availability_rules").insert(rows);
  }

  revalidatePath("/owner/availability");
}

export async function addBlock(formData: FormData) {
  const supabase = createClient();

  const date = String(formData.get("date"));
  const reason = String(formData.get("reason") ?? "");
  const startTime = String(formData.get("startTime") || "00:00");
  const endTime = String(formData.get("endTime") || "23:59");

  await supabase.from("availability_blocks").insert({
    start_at: `${date}T${startTime}:00`,
    end_at: `${date}T${endTime}:59`,
    reason,
  });

  revalidatePath("/owner/availability");
}

export async function deleteBlock(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id"));

  await supabase.from("availability_blocks").delete().eq("id", id);

  revalidatePath("/owner/availability");
}
