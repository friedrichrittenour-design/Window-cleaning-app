import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { signOut } from "@/app/actions";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f4fbff]">
      <Navbar
        links={[{ href: "/dashboard", label: "My Quotes" }]}
        cta={{ href: "/quotes/new", label: "New Quote" }}
        signOutAction={signOut}
      />
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
