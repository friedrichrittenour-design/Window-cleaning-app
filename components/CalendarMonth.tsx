"use client";

import { useState } from "react";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function CalendarMonth({
  selectedDate,
  onSelectDate,
  markedDates = [],
  minDate,
}: {
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
  markedDates?: string[];
  minDate?: string;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateStr(viewYear, viewMonth, day));
  }

  function goPrev() {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function goNext() {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="border-[3px] border-black shadow-hard bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goPrev}
          className="w-8 h-8 border-2 border-black font-bold bg-yellow-neon"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="font-display uppercase text-sm text-navy">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="w-8 h-8 border-2 border-black font-bold bg-yellow-neon"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-[#4a5875] mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const disabled = minDate ? date < minDate : false;
          const isSelected = date === selectedDate;
          const isMarked = markedDates.includes(date);
          const dayNum = Number(date.slice(-2));

          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(date)}
              className={`relative aspect-square text-xs font-bold border-2 border-black ${
                disabled
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : isSelected
                  ? "bg-electric text-black"
                  : "bg-[#f4fbff] hover:bg-yellow-neon"
              }`}
            >
              {dayNum}
              {isMarked && (
                <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-pink-neon" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
