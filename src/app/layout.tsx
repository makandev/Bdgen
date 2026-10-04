import type { Metadata, Viewport } from "next";
import { InstallFab } from "@/components/Install";
import { BASE } from "@/lib/base";
import { cspBootScript } from "@/lib/csp";
import "./globals.css";

export const metadata: Metadata = {
  title: "Funkelpost – persönliche Überraschungen",
  description: "Persönliche, KI-gestützte Überraschungskarten für Familie und Freunde",
  robots: { index: false, follow: false },
  manifest: `${BASE}/manifest.webmanifest`,
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: "Funkelpost", statusBarStyle: "default" },
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
      <head>
        {/* Dev mode needs eval for hot reloading; the server version sends the policy as a header too. */}
        {process.env.NODE_ENV === "production" && <script dangerouslySetInnerHTML={{ __html: cspBootScript() }} />}
      </head>
      <body>
        {children}
        <InstallFab />
      </body>
    </html>
  );
}
