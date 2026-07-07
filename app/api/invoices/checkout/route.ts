import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { createStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { invoiceId } = await request.json();
  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }

  // RLS ensures this only returns the invoice if it belongs to the caller.
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, quotes(address)")
    .eq("id", invoiceId)
    .single();

  if (!invoice || invoice.status !== "unpaid" || invoice.amount_due <= 0) {
    return NextResponse.json({ error: "Invoice not payable" }, { status: 400 });
  }

  const stripe = createStripeClient();
  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(invoice.amount_due * 100),
          product_data: {
            name: invoice.quotes?.address
              ? `Cleaning service — ${invoice.quotes.address}`
              : "Cleaning service",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/quotes/${invoice.quote_id}?payment=success`,
    cancel_url: `${origin}/quotes/${invoice.quote_id}?payment=cancelled`,
    metadata: { invoice_id: invoice.id },
  });

  const service = createServiceRoleClient();
  await service
    .from("invoices")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", invoice.id);

  return NextResponse.json({ url: session.url });
}
