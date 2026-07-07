"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarMonth } from "@/components/CalendarMonth";

export interface AppointmentSummary {
  id: string;
  quoteId: string;
  clientName: string;
  address: string | null;
  startAt: string;
  endAt: string;
}

function toDateStr(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function OwnerCalendarClient({
  appointments,
}: {
  appointments: AppointmentSummary[];
}) {
  const todayStr = toDateStr(new Date().toISOString());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const markedDates = Array.from(new Set(appointments.map((a) => toDateStr(a.startAt))));
  const dayAppointments = appointments.filter((a) => toDateStr(a.startAt) === selectedDate);

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-6 items-start">
      <CalendarMonth
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        markedDates={markedDates}
      />

      <div className="bg-white border-[3px] border-black shadow-hard p-6">
        <h2 className="font-display uppercase text-lg text-navy mb-4">
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>

        {dayAppointments.length === 0 ? (
          <p className="text-sm text-[#4a5875]">No appointments booked.</p>
        ) : (
          <ul className="grid gap-3">
            {dayAppointments.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/owner/quotes/${a.quoteId}`}
                  className="block border-2 border-black shadow-hard-sm p-4 hover:-translate-y-0.5 transition-transform bg-[#f4fbff]"
                >
                  <p className="font-bold text-navy">
                    {new Date(a.startAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(a.endAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-[#10102a]">{a.clientName}</p>
                  {a.address && (
                    <p className="text-xs text-[#4a5875]">{a.address}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
