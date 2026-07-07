import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getAvailableSlots } from "@/lib/scheduling";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date=YYYY-MM-DD is required" }, { status: 400 });
  }

  const service = createServiceRoleClient();

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

  const slots = getAvailableSlots(
    date,
    (rules ?? []).map((r: any) => ({
      dayOfWeek: r.day_of_week,
      startTime: r.start_time,
      endTime: r.end_time,
    })),
    (blocks ?? []).map((b: any) => ({ startAt: b.start_at, endAt: b.end_at })),
    (appointments ?? []).map((a: any) => ({ startAt: a.start_at, endAt: a.end_at }))
  );

  return NextResponse.json({ slots });
}
