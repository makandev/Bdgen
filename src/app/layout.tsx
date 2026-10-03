import type { Metadata, Viewport } from "next";
import { BASE } from "@/lib/base";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bdgen – persönliche Überraschungen",
  description: "Persönliche, KI-gestützte Überraschungskarten für Familie und Freunde",
  robots: { index: false, follow: false },
  manifest: `${BASE}/manifest.webmanifest`,
  icons: { apple: `${BASE}/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: "Bdgen", statusBarStyle: "default" },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf7ed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
