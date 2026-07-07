import { createClient } from "@/lib/supabase/server";
import { OwnerCalendarClient, type AppointmentSummary } from "./OwnerCalendarClient";

export default async function OwnerCalendarPage() {
  const supabase = createClient();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, quote_id, start_at, end_at, quotes(address, profiles(full_name))")
    .eq("status", "scheduled")
    .order("start_at");

  const summaries: AppointmentSummary[] = (appointments ?? []).map((a: any) => ({
    id: a.id,
    quoteId: a.quote_id,
    clientName: a.quotes?.profiles?.full_name ?? "Client",
    address: a.quotes?.address ?? null,
    startAt: a.start_at,
    endAt: a.end_at,
  }));

  return (
    <div>
      <h1 className="font-display uppercase text-2xl text-navy mb-6">
        Calendar
      </h1>
      <OwnerCalendarClient appointments={summaries} />
    </div>
  );
}
