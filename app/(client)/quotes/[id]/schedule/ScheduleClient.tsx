"use client";

import { useEffect, useState } from "react";
import { CalendarMonth } from "@/components/CalendarMonth";
import { bookAppointment } from "./actions";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function ScheduleClient({
  quoteId,
  error,
}: {
  quoteId: string;
  error?: string;
}) {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/availability/slots?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots ?? []))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-6 items-start">
      <CalendarMonth
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        minDate={todayStr()}
      />

      <div className="bg-white border-[3px] border-black shadow-hard p-6">
        <h2 className="font-display uppercase text-lg text-navy mb-4">
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>

        {error === "slot_taken" && (
          <p className="text-sm font-bold text-pink-neon mb-3">
            That time was just booked by someone else — pick another slot.
          </p>
        )}

        {loading && <p className="text-sm text-[#4a5875]">Loading times...</p>}

        {!loading && slots.length === 0 && (
          <p className="text-sm text-[#4a5875]">
            No available times on this date. Try another day.
          </p>
        )}

        {!loading && slots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {slots.map((slot) => (
              <form key={slot} action={bookAppointment}>
                <input type="hidden" name="quoteId" value={quoteId} />
                <input type="hidden" name="startAt" value={slot} />
                <button
                  type="submit"
                  className="w-full border-[3px] border-black shadow-hard-sm bg-green-neon font-bold text-sm py-2.5 hover:bg-electric"
                >
                  {new Date(slot).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
