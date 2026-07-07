"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markInvoicePaid(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId"));

  const supabase = createClient();

  await supabase
    .from("invoices")
    .update({
      status: "paid",
      payment_method: "manual",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("status", "unpaid");

  revalidatePath("/owner/invoices");
}
