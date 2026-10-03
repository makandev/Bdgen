"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { EXAMPLES, exampleCard, type Example } from "@/lib/examples";
import { occasionLabel, PRESETS, relationEmoji } from "@/lib/presets";
import { renderCardHTML } from "@/lib/render";

/** Live miniature of a card; only mounted while visible so a phone isn't running 12 animations at once. */
function Thumb({ e }: { e: Example }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const html = useMemo(() => {
    const d = exampleCard(e);
    return renderCardHTML({ ...d, effects: { ...d.effects, confetti: 0, ribbons: 0, sparks: false } });
  }, [e]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="thumb" style={{ background: PRESETS[e.preset].theme.bg }}>
      {visible && <iframe title={e.title} srcDoc={html} sandbox="allow-scripts" tabIndex={-1} aria-hidden="true" />}
    </div>
  );
}

export default function ExamplesPage() {
  const [open, setOpen] = useState<Example | null>(null);
  const full = useMemo(() => (open ? renderCardHTML(exampleCard(open)) : ""), [open]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="shell">
      <TopBar>
        <Link href="/" className="btn ghost sm hide-sm">← Übersicht</Link>
      </TopBar>
      <div className="stack">
        <div>
          <div className="eyebrow">Beispiele</div>
          <h1>So kann deine Überraschung aussehen</h1>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            Zwölf Designs, zwölf Menschen. Tippe auf eine Karte, um sie in groß mit allen Effekten zu erleben.
          </p>
        </div>
        <div className="gallery">
          {EXAMPLES.map((e) => (
            <button key={e.id} type="button" className="gallery-item" onClick={() => setOpen(e)}>
              <Thumb e={e} />
              <div className="gallery-meta">
                <strong>{relationEmoji(e.relation)} {e.title}</strong>
                <span className="tag">{PRESETS[e.preset].label}</span>
                <span className="muted small">„{e.notes}“</span>
              </div>
            </button>
          ))}
        </div>
        <p className="muted small">
          Die Texte in den Beispielen zeigen, was die KI aus ein paar Stichworten macht. Deine eigene Karte wird natürlich ganz persönlich.
        </p>
      </div>

      {open && (
        <div className="demo-backdrop" role="dialog" aria-modal="true" aria-label={open.title}>
          <div className="demo">
            <iframe title={open.title} srcDoc={full} sandbox="allow-scripts" />
            <div className="demo-bar">
              <div className="small">
                <strong>{relationEmoji(open.relation)} {open.title}</strong> · {PRESETS[open.preset].label} · {occasionLabel(open.occasion)}
              </div>
              <div className="row">
                <Link href={`/kontakt/?id=neu&design=${open.preset}`} className="btn sm">Dieses Design verwenden →</Link>
                <button className="btn ghost sm" onClick={() => setOpen(null)}>Schließen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
