export const APPOINTMENT_DURATION_MINUTES = 120;
export const SLOT_INTERVAL_MINUTES = 60;

export interface AvailabilityRule {
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // "HH:MM" or "HH:MM:SS"
  endTime: string;
}

export interface TimeRange {
  startAt: string; // ISO datetime
  endAt: string;
}

function normalizeTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

function parseDateTime(date: string, time: string): number {
  return new Date(`${date}T${normalizeTime(time)}`).getTime();
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Returns available appointment start times (ISO) for the given date. */
export function getAvailableSlots(
  date: string, // "YYYY-MM-DD"
  rules: AvailabilityRule[],
  blocks: TimeRange[],
  existingAppointments: TimeRange[],
  durationMinutes: number = APPOINTMENT_DURATION_MINUTES,
  intervalMinutes: number = SLOT_INTERVAL_MINUTES
): string[] {
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const todaysRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);
  if (todaysRules.length === 0) return [];

  const busyRanges = [...blocks, ...existingAppointments].map((r) => ({
    start: new Date(r.startAt).getTime(),
    end: new Date(r.endAt).getTime(),
  }));

  const durationMs = durationMinutes * 60_000;
  const intervalMs = intervalMinutes * 60_000;

  const slots: string[] = [];

  for (const rule of todaysRules) {
    const windowStart = parseDateTime(date, rule.startTime);
    const windowEnd = parseDateTime(date, rule.endTime);

    for (
      let start = windowStart;
      start + durationMs <= windowEnd;
      start += intervalMs
    ) {
      const end = start + durationMs;
      const isBusy = busyRanges.some((b) =>
        rangesOverlap(start, end, b.start, b.end)
      );
      if (!isBusy) {
        slots.push(new Date(start).toISOString());
      }
    }
  }

  return slots;
}
