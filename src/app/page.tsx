import type { Metadata } from "next";
import Link from "next/link";
import { BASE, HOME } from "@/lib/base";
import { rgba } from "@/lib/color";
import { presetTheme } from "@/lib/presets";
import { EXAMPLES } from "@/lib/examples";
import { StandaloneToApp } from "./StandaloneToApp";

export const metadata: Metadata = {
  title: "Funkelpost",
  description: "Eine kleine Überraschung – persönlich, animiert, mit Herz.",
};

// The start page is a showcase: one finished card (public/showcase.html, built by
// scripts/prepare-public.mjs), nothing else. The way into the app is the logo.
const example = EXAMPLES.find((e) => e.id === "oma") ?? EXAMPLES[0];
const t = presetTheme(example.preset);

export default function Showcase() {
  return (
    <div className="showcase" style={{ background: t.bg }}>
      <StandaloneToApp />
      <header className="showcase-bar" style={{ background: t.bg, color: t.text, borderColor: rgba(t.accent, 0.2) }}>
        <Link href={HOME} prefetch={false} className="showcase-brand" style={{ color: t.text }}>
          <span style={{ color: t.accent }} aria-hidden="true">✦</span> Funkelpost
        </Link>
      </header>
      <iframe className="showcase-card" title={example.title} src={`${BASE}/showcase.html`} sandbox="allow-scripts" />
    </div>
  );
}
