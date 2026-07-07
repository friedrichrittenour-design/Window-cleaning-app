import Link from "next/link";
import { Button } from "./Button";

type NavLink = { href: string; label: string };

export function Navbar({
  links,
  cta,
  signOutAction,
}: {
  links: NavLink[];
  cta?: { href: string; label: string };
  signOutAction?: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 bg-navy border-b-4 border-electric">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-extrabold text-lg text-yellow-neon uppercase"
          style={{ textShadow: "2px 2px 0 #ff2fd0" }}
        >
          <span className="text-xl">🪟</span>
          <span>Crystal Clear</span>
        </Link>

        <nav className="hidden md:flex gap-7 flex-1 justify-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white font-bold text-sm uppercase tracking-wide hover:text-electric"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {cta && (
            <Button href={cta.href} className="!px-5 !py-2.5 !text-xs">
              {cta.label}
            </Button>
          )}
          {signOutAction && (
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-electric font-bold text-xs uppercase tracking-wide hover:text-pink-neon"
              >
                Sign Out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
