"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message ?? "Could not log in.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    router.push(profile?.role === "owner" ? "/owner/dashboard" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-diagonal-navy flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-white border-[3px] border-black shadow-hard p-8">
        <h1 className="font-display uppercase text-2xl text-navy mb-1">
          Welcome Back
        </h1>
        <p className="text-sm text-[#2c2c54] mb-6">
          Log in to view your quotes or manage your business.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Password
            </span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>

          {error && <p className="text-sm font-bold text-pink-neon">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-gradient-to-br from-electric to-pink-neon text-black font-bold uppercase text-sm border-[3px] border-black shadow-hard py-3 disabled:opacity-60"
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>

        <p className="text-sm mt-5 text-center">
          Need an account?{" "}
          <Link href="/signup" className="font-bold text-electric-dark">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
