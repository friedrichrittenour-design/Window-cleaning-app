import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScheduleClient } from "./ScheduleClient";

export default async function ScheduleQuotePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!quote || quote.status !== "confirmed") {
    redirect(`/quotes/${params.id}`);
  }

  const { data: existingAppointment } = await supabase
    .from("appointments")
    .select("id")
    .eq("quote_id", params.id)
    .eq("status", "scheduled")
    .maybeSingle();

  if (existingAppointment) {
    redirect(`/quotes/${params.id}`);
  }

  return (
    <div>
      <h1 className="font-display uppercase text-2xl text-navy mb-6">
        Schedule Your Visit
      </h1>
      <ScheduleClient quoteId={params.id} error={searchParams.error} />
    </div>
  );
}
