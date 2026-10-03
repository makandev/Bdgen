"use client";

import { PRESETS } from "@/lib/presets";
import type { Theme } from "@/lib/types";

const FONT_CSS: Record<string, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: "ui-sans-serif, system-ui, sans-serif",
  script: '"Snell Roundhand", "Segoe Script", cursive',
  mono: "ui-monospace, Menlo, Consolas, monospace",
  block: '"Arial Black", Impact, sans-serif',
};

/** Tiny visual of a design: background, card in its style, heading font and button. */
export function MiniCard({ theme }: { theme: Omit<Theme, "preset"> }) {
  const style = theme.style ?? "glass";
  const card: React.CSSProperties = {
    position: "absolute", left: "16%", right: "16%", top: "14%", bottom: "14%",
    background: theme.card, borderRadius: 7, display: "grid", placeItems: "center", alignContent: "center", gap: 4,
    border: `1px solid ${theme.accent}55`,
  };
  if (style === "luxe") Object.assign(card, { border: `1px solid ${theme.accent}`, boxShadow: `inset 0 0 0 3px ${theme.card}, inset 0 0 0 4px ${theme.accent}88, 0 0 14px ${theme.accent}55` });
  if (style === "holo") Object.assign(card, { border: "2px solid transparent", background: `linear-gradient(${theme.card},${theme.card}) padding-box, linear-gradient(120deg, ${theme.confetti.join(",")}) border-box` });
  if (style === "terminal") Object.assign(card, { borderRadius: 3, border: `1px solid ${theme.accent}`, boxShadow: `0 0 10px ${theme.accent}88` });
  if (style === "pixel") Object.assign(card, { borderRadius: 3, border: `2px solid ${theme.text}`, boxShadow: `3px 3px 0 ${theme.text}` });
  const pill: React.CSSProperties = {
    width: 26, height: 7, borderRadius: style === "pixel" || style === "terminal" ? 2 : 9,
    background: style === "terminal" ? "transparent" : `linear-gradient(135deg, ${theme.accentLight}, ${theme.accent}, ${theme.accentDark})`,
    border: style === "terminal" ? `1px solid ${theme.accent}` : style === "pixel" ? `1.5px solid ${theme.text}` : "none",
  };
  return (
    <div className="sw" style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.bg2})` }}>
      <div style={card}>
        <span style={{ fontFamily: FONT_CSS[theme.headingFont] ?? FONT_CSS.serif, fontWeight: theme.headingFont === "block" ? 900 : 600, fontSize: 13, lineHeight: 1, color: style === "terminal" ? theme.accent : theme.text }}>
          Aa
        </span>
        <span style={pill} />
      </div>
    </div>
  );
}

export function PresetGrid({ value, onPick }: { value: string; onPick: (key: string) => void }) {
  return (
    <div className="swatches">
      {Object.entries(PRESETS).map(([key, p]) => (
        <button key={key} type="button" className={`swatch${value === key ? " on" : ""}`} onClick={() => onPick(key)} title={p.hint}>
          <MiniCard theme={p.theme} />
          {p.label}
        </button>
      ))}
    </div>
  );
}
