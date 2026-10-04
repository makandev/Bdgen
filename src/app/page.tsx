import type { Metadata } from "next";
import Link from "next/link";
import { EXAMPLES, exampleCard } from "@/lib/examples";
import { renderCardHTML } from "@/lib/render";

export const metadata: Metadata = {
  title: "Funkelpost",
  description: "Eine kleine Überraschung – persönlich, animiert, mit Herz.",
};

// The start page is a showcase: one finished card, nothing else. The way into the app is the logo.
const example = EXAMPLES.find((e) => e.id === "oma") ?? EXAMPLES[0];
const card = exampleCard(example);
const html = renderCardHTML(card, { showcase: true });

export default function Showcase() {
  const t = card.theme;
  return (
    <div className="showcase" style={{ background: t.bg }}>
      <header className="showcase-bar" style={{ background: t.bg, color: t.text, borderColor: `${t.accent}33` }}>
        <Link href="/start/" className="showcase-brand" style={{ color: t.text }}>
          <span style={{ color: t.accent }} aria-hidden="true">✦</span> Funkelpost
        </Link>
      </header>
      <iframe className="showcase-card" title={example.title} srcDoc={html} sandbox="allow-scripts" />
    </div>
  );
}
