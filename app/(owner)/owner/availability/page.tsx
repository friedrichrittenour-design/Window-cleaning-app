import { createClient } from "@/lib/supabase/server";
import { saveAvailability, addBlock, deleteBlock } from "./actions";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function OwnerAvailabilityPage() {
  const supabase = createClient();

  const { data: rules } = await supabase
    .from("availability_rules")
    .select("*")
    .order("day_of_week");

  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("*")
    .order("start_at");

  const rulesByDay = new Map((rules ?? []).map((r) => [r.day_of_week, r]));

  return (
    <div>
      <h1 className="font-display uppercase text-2xl text-navy mb-2">
        Availability
      </h1>
      <p className="text-sm text-[#4a5875] mb-6">
        Set your standard weekly hours, then block off any specific dates
        you&apos;re unavailable.
      </p>

      <form
        action={saveAvailability}
        className="bg-white border-[3px] border-black shadow-hard p-8 grid gap-4 max-w-2xl mb-10"
      >
        <h2 className="font-display uppercase text-sm text-pink-neon">
          Weekly Hours
        </h2>

        {DAY_LABELS.map((label, day) => {
          const rule = rulesByDay.get(day);
          return (
            <div
              key={day}
              className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[140px_1fr_1fr] items-center gap-3"
            >
              <label className="flex items-center gap-2 font-bold text-sm text-navy">
                <input
                  type="checkbox"
                  name={`day_${day}_enabled`}
                  defaultChecked={Boolean(rule)}
                  className="w-4 h-4"
                />
                {label}
              </label>
              <input
                type="time"
                name={`day_${day}_start`}
                defaultValue={rule?.start_time?.slice(0, 5) ?? "09:00"}
                className="border-2 border-navy px-2 py-1.5 bg-[#f4fbff] text-sm"
              />
              <input
                type="time"
                name={`day_${day}_end`}
                defaultValue={rule?.end_time?.slice(0, 5) ?? "17:00"}
                className="border-2 border-navy px-2 py-1.5 bg-[#f4fbff] text-sm"
              />
            </div>
          );
        })}

        <button
          type="submit"
          className="mt-2 bg-gradient-to-br from-electric to-pink-neon text-black font-bold uppercase text-sm border-[3px] border-black shadow-hard py-3"
        >
          Save Weekly Hours
        </button>
      </form>

      <div className="bg-white border-[3px] border-black shadow-hard p-8 max-w-2xl">
        <h2 className="font-display uppercase text-sm text-pink-neon mb-4">
          Blocked Dates
        </h2>

        {blocks && blocks.length > 0 && (
          <ul className="grid gap-2 mb-6">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between border-2 border-navy px-3 py-2 text-sm"
              >
                <span>
                  <strong className="text-navy">
                    {new Date(block.start_at).toLocaleDateString()}
                  </strong>
                  {block.reason && (
                    <span className="text-[#4a5875]"> — {block.reason}</span>
                  )}
                </span>
                <form action={deleteBlock}>
                  <input type="hidden" name="id" value={block.id} />
                  <button
                    type="submit"
                    className="text-pink-neon font-bold text-xs uppercase"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addBlock} className="grid sm:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Date
            </span>
            <input
              required
              type="date"
              name="date"
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Reason (optional)
            </span>
            <input
              name="reason"
              placeholder="Vacation, fully booked, etc."
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Start Time (optional)
            </span>
            <input
              type="time"
              name="startTime"
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              End Time (optional)
            </span>
            <input
              type="time"
              name="endTime"
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>
          <button
            type="submit"
            className="sm:col-span-2 bg-yellow-neon text-navy font-bold uppercase text-sm border-[3px] border-black shadow-hard py-3"
          >
            Block This Date
          </button>
        </form>
      </div>
    </div>
  );
}
