import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Superior Window Washing",
  description:
    "Professional residential & commercial window cleaning. Get an instant photo-based quote.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
