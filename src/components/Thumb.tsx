"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { exampleCard, type Example } from "@/lib/examples";
import { PRESETS } from "@/lib/presets";
import { renderCardHTML } from "@/lib/render";

/** Live miniature of an example card; only mounted while visible so a phone isn't running many animations at once. */
export function Thumb({ e, small }: { e: Example; small?: boolean }) {
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
    <div ref={ref} className={`thumb${small ? " small" : ""}`} style={{ background: PRESETS[e.preset].theme.bg }}>
      {visible && <iframe title={e.title} srcDoc={html} sandbox="allow-scripts" tabIndex={-1} aria-hidden="true" />}
    </div>
  );
}
