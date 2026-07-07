"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REFERRAL_BONUS_AMOUNT } from "@/lib/referrals";

async function getAvailableCredit(
  supabase: ReturnType<typeof createClient>,
  profileId: string
): Promise<number> {
  const { data } = await supabase
    .from("credits")
    .select("amount")
    .eq("profile_id", profileId);

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export async function updateQuote(formData: FormData) {
  const quoteId = String(formData.get("quoteId"));
  const status = String(formData.get("status"));
  const finalPrice = formData.get("finalPrice") ? Number(formData.get("finalPrice")) : null;
  const requestedCredit = Number(formData.get("creditApplied") ?? 0);
  const ownerNotes = String(formData.get("ownerNotes") ?? "");

  const supabase = createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("client_id, status")
    .eq("id", quoteId)
    .single();

  if (!quote) return;

  // Grant the referral bonus the first time this client's job is confirmed.
  // The partial unique index on credits(profile_id) where reason =
  // 'referral_referred' makes the first insert a silent no-op on any later
  // confirmation, so this is safe to attempt every time.
  if (status === "confirmed") {
    const { data: client } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", quote.client_id)
      .single();

    if (client?.referred_by) {
      const { error: referredError } = await supabase.from("credits").insert({
        profile_id: quote.client_id,
        amount: REFERRAL_BONUS_AMOUNT,
        reason: "referral_referred",
        quote_id: quoteId,
      });

      if (!referredError) {
        await supabase.from("credits").insert({
          profile_id: client.referred_by,
          amount: REFERRAL_BONUS_AMOUNT,
          reason: "referral_referrer",
          quote_id: quoteId,
        });
      }
    }
  }

  // Undo any previous redemption tied to this quote so re-saving the form
  // (e.g. just editing notes) recomputes cleanly instead of double-deducting.
  await supabase
    .from("credits")
    .delete()
    .eq("quote_id", quoteId)
    .eq("reason", "redeemed");

  // Clamp the credit redemption to what's actually available and owed.
  const availableBalance = await getAvailableCredit(supabase, quote.client_id);
  const maxRedeemable = Math.max(0, Math.min(availableBalance, finalPrice ?? 0));
  const creditApplied = Math.max(0, Math.min(requestedCredit, maxRedeemable));

  if (creditApplied > 0) {
    await supabase.from("credits").insert({
      profile_id: quote.client_id,
      amount: -creditApplied,
      reason: "redeemed",
      quote_id: quoteId,
    });
  }

  await supabase
    .from("quotes")
    .update({
      status,
      final_price: finalPrice,
      credit_applied: creditApplied,
      owner_notes: ownerNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId);

  revalidatePath(`/owner/quotes/${quoteId}`);
  revalidatePath("/owner/dashboard");
}
