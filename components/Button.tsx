import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-gradient-to-br from-electric to-pink-neon text-black",
  ghost: "bg-yellow-neon text-navy",
};

const base =
  "inline-block px-7 py-3.5 rounded font-bold uppercase tracking-wide text-sm border-[3px] border-black shadow-hard transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-hard-active";

export function Button({
  variant = "primary",
  href,
  children,
  className = "",
  ...props
}: {
  variant?: Variant;
  href?: string;
  children: React.ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `${base} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
