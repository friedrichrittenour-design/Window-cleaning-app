import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { markInvoicePaid } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  unpaid: "bg-pink-neon text-black",
  paid: "bg-green-neon text-navy",
  void: "bg-white text-navy",
};

export default async function OwnerInvoicesPage() {
  const supabase = createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, quotes(address), profiles(full_name)")
    .order("created_at", { ascending: false });

  const unpaid = (invoices ?? []).filter((i) => i.status === "unpaid");
  const paid = (invoices ?? []).filter((i) => i.status !== "unpaid");

  return (
    <div>
      <h1 className="font-display uppercase text-2xl text-navy mb-6">
        Invoices
      </h1>

      <h2 className="font-display uppercase text-sm text-pink-neon mb-3">
        Unpaid ({unpaid.length})
      </h2>
      <InvoiceList invoices={unpaid} showMarkPaid />

      <h2 className="font-display uppercase text-sm text-pink-neon mt-10 mb-3">
        Paid / Void
      </h2>
      <InvoiceList invoices={paid} showMarkPaid={false} />
    </div>
  );
}

function InvoiceList({
  invoices,
  showMarkPaid,
}: {
  invoices: any[];
  showMarkPaid: boolean;
}) {
  if (invoices.length === 0) {
    return (
      <div className="border-[3px] border-black shadow-hard bg-white p-6 text-sm text-[#4a5875]">
        Nothing here yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="border-[3px] border-black shadow-hard-sm bg-white p-5 flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <Link
              href={`/owner/quotes/${invoice.quote_id}`}
              className="font-bold text-navy hover:underline"
            >
              {invoice.profiles?.full_name ?? "Client"} —{" "}
              {invoice.quotes?.address || "Property quote"}
            </Link>
            <p className="text-xs text-[#4a5875] uppercase">
              {invoice.payment_method ? `Paid via ${invoice.payment_method}` : "Awaiting payment"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-electric-dark">
              ${invoice.amount_due}
            </span>
            <span
              className={`inline-block border-2 border-black px-3 py-1 text-xs font-bold uppercase shadow-hard-sm ${
                STATUS_STYLES[invoice.status] ?? "bg-white"
              }`}
            >
              {invoice.status}
            </span>
            {showMarkPaid && (
              <form action={markInvoicePaid}>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <button
                  type="submit"
                  className="border-2 border-black bg-yellow-neon font-bold uppercase text-xs px-3 py-2 shadow-hard-sm"
                >
                  Mark Paid
                </button>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
