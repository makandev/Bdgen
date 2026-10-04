"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { exampleCard, type Example } from "@/lib/examples";
import { PRESETS } from "@/lib/presets";
import { renderCardHTML } from "@/lib/render";

/** Live miniature of an example card; only mounted while visible so a phone isn't running many animations at once. */
export function Thumb({ e, small }: { e: Example; small?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const html = useMemo(() => {
    const d = exampleCard(e);
    return renderCardHTML({ ...d, effects: { ...d.effects, confetti: 0, ribbons: 0, sparks: false } }, { reactionMode: "preview" });
  }, [e]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (!entry.isIntersecting) setReady(false);
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const t = PRESETS[e.preset].theme;
  return (
    <div ref={ref} className={`thumb${small ? " small" : ""}`} style={{ background: `linear-gradient(160deg, ${t.bg}, ${t.bg2})` }}>
      {!ready && (
        <div className="thumb-ph" aria-hidden="true">
          <div style={{ background: t.card, color: t.text, border: `1px solid ${t.accent}55` }}>
            <span style={{ color: t.accent }}>✦ ✦ ✦</span>
            <strong style={{ fontFamily: t.headingFont === "sans" || t.headingFont === "block" ? "system-ui, sans-serif" : "Georgia, serif" }}>{e.greeting.split(/[.!:]/)[0]}</strong>
            <span className="pill" style={{ background: `linear-gradient(135deg, ${t.accentLight}, ${t.accent})` }} />
          </div>
        </div>
      )}
      {visible && (
        <iframe
          className={ready ? "ready" : ""}
          title={e.title}
          srcDoc={html}
          sandbox="allow-scripts"
          tabIndex={-1}
          aria-hidden="true"
          // The card fades its first page in; keep the placeholder until that has happened.
          onLoad={() => setTimeout(() => setReady(true), 700)}
        />
      )}
    </div>
  );
}
