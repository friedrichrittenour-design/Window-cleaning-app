"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateQuote(formData: FormData) {
  const quoteId = String(formData.get("quoteId"));
  const status = String(formData.get("status"));
  const finalPrice = formData.get("finalPrice");
  const ownerNotes = String(formData.get("ownerNotes") ?? "");

  const supabase = createClient();

  await supabase
    .from("quotes")
    .update({
      status,
      final_price: finalPrice ? Number(finalPrice) : null,
      owner_notes: ownerNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId);

  revalidatePath(`/owner/quotes/${quoteId}`);
  revalidatePath("/owner/dashboard");
}
