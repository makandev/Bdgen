import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eine kleine Überraschung ✨",
  description: "Für dich. Einfach öffnen.",
  openGraph: { title: "Eine kleine Überraschung ✨", description: "Für dich. Einfach öffnen." },
};

export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
