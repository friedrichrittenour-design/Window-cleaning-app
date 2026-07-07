import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { signOut } from "@/app/actions";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#f4fbff]">
      <Navbar
        links={[
          { href: "/owner/dashboard", label: "Quotes" },
          { href: "/owner/invoices", label: "Invoices" },
          { href: "/owner/calendar", label: "Calendar" },
          { href: "/owner/availability", label: "Availability" },
          { href: "/owner/pricing", label: "Pricing" },
        ]}
        signOutAction={signOut}
      />
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
