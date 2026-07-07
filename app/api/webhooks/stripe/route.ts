import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = createStripeClient();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { id: string; payment_intent: string | null };

    const service = createServiceRoleClient();
    await service
      .from("invoices")
      .update({
        status: "paid",
        payment_method: "stripe",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_checkout_session_id", session.id)
      .eq("status", "unpaid");
  }

  return NextResponse.json({ received: true });
}
