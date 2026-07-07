"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<"client" | "owner">("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Could not create account.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      role,
      full_name: fullName,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push(role === "owner" ? "/owner/dashboard" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-diagonal-navy flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-white border-[3px] border-black shadow-hard p-8">
        <h1 className="font-display uppercase text-2xl text-navy mb-1">
          Create Account
        </h1>
        <p className="text-sm text-[#2c2c54] mb-6">
          Sign up as a client to request quotes, or as a business owner to
          manage them.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`border-[3px] border-black py-2.5 font-bold uppercase text-xs shadow-hard-sm ${
                role === "client" ? "bg-electric" : "bg-white"
              }`}
            >
              I&apos;m a Client
            </button>
            <button
              type="button"
              onClick={() => setRole("owner")}
              className={`border-[3px] border-black py-2.5 font-bold uppercase text-xs shadow-hard-sm ${
                role === "owner" ? "bg-pink-neon" : "bg-white"
              }`}
            >
              I&apos;m a Business Owner
            </button>
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-navy">
              Full Name
            </span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border-2 border-navy px-3 py-2.5 bg-[#f4fbff]"
            />
          </label>

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
              minLength={6}
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm mt-5 text-center">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-electric-dark">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
