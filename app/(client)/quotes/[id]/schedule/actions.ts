"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getAvailableSlots, APPOINTMENT_DURATION_MINUTES } from "@/lib/scheduling";

export async function bookAppointment(formData: FormData) {
  const quoteId = String(formData.get("quoteId"));
  const startAt = String(formData.get("startAt"));

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const service = createServiceRoleClient();

  const { data: quote } = await service
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (!quote || quote.client_id !== user.id || quote.status !== "confirmed") {
    redirect(`/quotes/${quoteId}`);
  }

  const date = startAt.slice(0, 10);
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const [{ data: rules }, { data: blocks }, { data: appointments }] = await Promise.all([
    service.from("availability_rules").select("*").eq("day_of_week", dayOfWeek),
    service
      .from("availability_blocks")
      .select("*")
      .lt("start_at", dayEnd)
      .gt("end_at", dayStart),
    service
      .from("appointments")
      .select("*")
      .eq("status", "scheduled")
      .lt("start_at", dayEnd)
      .gt("end_at", dayStart),
  ]);

  const availableSlots = getAvailableSlots(
    date,
    (rules ?? []).map((r: any) => ({
      dayOfWeek: r.day_of_week,
      startTime: r.start_time,
      endTime: r.end_time,
    })),
    (blocks ?? []).map((b: any) => ({ startAt: b.start_at, endAt: b.end_at })),
    (appointments ?? []).map((a: any) => ({ startAt: a.start_at, endAt: a.end_at }))
  );

  if (!availableSlots.includes(startAt)) {
    redirect(`/quotes/${quoteId}/schedule?error=slot_taken`);
  }

  const endAt = new Date(
    new Date(startAt).getTime() + APPOINTMENT_DURATION_MINUTES * 60_000
  ).toISOString();

  await service.from("appointments").insert({
    quote_id: quoteId,
    client_id: user.id,
    start_at: startAt,
    end_at: endAt,
    status: "scheduled",
  });

  redirect(`/quotes/${quoteId}`);
}
