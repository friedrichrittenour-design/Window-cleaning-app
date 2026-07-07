"use client";

import { useState } from "react";

export function PayNowButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/invoices/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      setError(data.error ?? "Could not start checkout.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="bg-gradient-to-br from-electric to-pink-neon text-black font-bold uppercase text-sm border-[3px] border-black shadow-hard px-6 py-3 disabled:opacity-60"
      >
        {loading ? "Redirecting..." : "Pay Now"}
      </button>
      {error && <p className="text-sm font-bold text-pink-neon mt-2">{error}</p>}
    </div>
  );
}
