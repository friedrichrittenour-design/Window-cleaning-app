const STATUS_STYLES: Record<string, string> = {
  pending_analysis: "bg-yellow-neon text-navy",
  quoted: "bg-electric text-black",
  confirmed: "bg-green-neon text-navy",
  declined: "bg-pink-neon text-black",
};

const STATUS_LABELS: Record<string, string> = {
  pending_analysis: "Analyzing Photos",
  quoted: "Quoted",
  confirmed: "Confirmed",
  declined: "Declined",
};

export function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block border-2 border-black px-3 py-1 text-xs font-bold uppercase shadow-hard-sm ${
        STATUS_STYLES[status] ?? "bg-white"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
