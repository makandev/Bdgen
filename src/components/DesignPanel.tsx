"use client";

import { useState } from "react";
import { PRESETS, presetEffects, presetTheme } from "@/lib/presets";
import type { Effects, HeadingFont, Theme } from "@/lib/types";

const COLORS: [keyof Theme, string][] = [
  ["bg", "Hintergrund 1"],
  ["bg2", "Hintergrund 2"],
  ["card", "Karte"],
  ["text", "Überschriften"],
  ["text2", "Fließtext"],
  ["muted", "Nebentext"],
  ["accent", "Akzent"],
  ["accentLight", "Glanz"],
  ["accentDark", "Akzent dunkel"],
  ["cinemaBg", "Kino-Finale"],
];

const TOGGLES: [keyof Effects, string][] = [
  ["clock", "Uhr auf Seite 1"],
  ["progress", "Fortschrittsbalken"],
  ["orbit", "Glitzer in der Karte"],
  ["shine", "Glanzstreifen"],
  ["sparks", "Funken-Explosion"],
  ["cinema", "Kino-Finale"],
];

const SLIDERS: [keyof Effects, string, number, number][] = [
  ["confetti", "Konfetti", 0, 2],
  ["ribbons", "Bänder", 0, 2],
  ["ambient", "Lichtpartikel", 0, 2],
  ["speed", "Tempo", 0.5, 1.6],
];

const STYLE_IDEAS = ["mehr Konfetti, festlicher", "ruhiger und edler", "in Blautönen", "wie ein Sonnenuntergang", "verspielt und bunt", "dunkel mit Gold"];

export function DesignPanel({
  theme, effects, onChange, onPrompt, busy, aiReady,
}: {
  theme: Theme;
  effects: Effects;
  onChange: (theme: Theme, effects: Effects) => void;
  onPrompt: (instruction: string) => void;
  busy: boolean;
  aiReady: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const setTheme = (patch: Partial<Theme>) => onChange({ ...theme, ...patch, preset: "custom" }, effects);
  const setFx = (patch: Partial<Effects>) => onChange(theme, { ...effects, ...patch });

  return (
    <div className="stack">
      <div className="ai-box">
        <strong className="small">✨ Design & Effekte per Wunsch ändern</strong>
        <div className="chips">
          {STYLE_IDEAS.map((s) => (
            <button key={s} type="button" className="chip" disabled={busy} onClick={() => onPrompt(s)}>
              {s}
            </button>
          ))}
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (prompt.trim()) onPrompt(prompt);
          }}
        >
          <input
            type="text"
            value={prompt}
            disabled={busy}
            placeholder="z. B. „Farben wie Lavendel, weniger Bänder, schnelleres Finale“"
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button className="btn sm" disabled={busy || !prompt.trim()}>
            {busy ? <span className="spinner" /> : "Los"}
          </button>
        </form>
        {!aiReady && <small className="muted">Ohne KI-Schlüssel werden nur einfache Wünsche erkannt (z. B. „bunt“, „mehr Konfetti“).</small>}
      </div>

      <div>
        <h3 style={{ marginBottom: 8 }}>Vorlagen</h3>
        <div className="swatches">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              className={`swatch${theme.preset === key ? " on" : ""}`}
              onClick={() => onChange(presetTheme(key), { ...presetEffects(key), cinema: effects.cinema, clock: effects.clock, progress: effects.progress })}
            >
              <div className="sw" style={{ background: `linear-gradient(135deg, ${p.theme.bg}, ${p.theme.bg2})` }}>
                <span
                  style={{
                    position: "absolute", right: 8, bottom: 8, width: 22, height: 22, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${p.theme.accentLight}, ${p.theme.accent}, ${p.theme.accentDark})`,
                  }}
                />
              </div>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: 8 }}>Effekte</h3>
        <div className="stack" style={{ gap: 10 }}>
          {SLIDERS.map(([k, label, min, max]) => (
            <label key={k} className="slider">
              <span>{label}</span>
              <input
                type="range"
                min={min}
                max={max}
                step={0.1}
                value={effects[k] as number}
                onChange={(e) => setFx({ [k]: Number(e.target.value) })}
              />
              <span className="muted small">{k === "speed" ? `${(effects[k] as number).toFixed(1)}×` : (effects[k] as number) === 0 ? "aus" : (effects[k] as number).toFixed(1)}</span>
            </label>
          ))}
          <div className="toggle-grid">
            {TOGGLES.map(([k, label]) => (
              <label key={k} className="toggle">
                <input type="checkbox" checked={effects[k] as boolean} onChange={(e) => setFx({ [k]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: 8 }}>Farben & Schrift</h3>
        <div className="color-grid">
          {COLORS.map(([k, label]) => (
            <label key={k}>
              <input type="color" value={theme[k] as string} onChange={(e) => setTheme({ [k]: e.target.value })} />
              {label}
            </label>
          ))}
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>Konfetti-Farben</span>
          <div className="row">
            {theme.confetti.map((c, i) => (
              <input
                key={i}
                type="color"
                value={c}
                onChange={(e) => setTheme({ confetti: theme.confetti.map((x, k) => (k === i ? e.target.value : x)) })}
              />
            ))}
            {theme.confetti.length < 8 && (
              <button type="button" className="btn ghost sm icon" onClick={() => setTheme({ confetti: [...theme.confetti, theme.accent] })}>
                +
              </button>
            )}
            {theme.confetti.length > 1 && (
              <button type="button" className="btn ghost sm icon" onClick={() => setTheme({ confetti: theme.confetti.slice(0, -1) })}>
                −
              </button>
            )}
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <div className="seg">
            {(["serif", "sans", "script"] as HeadingFont[]).map((f) => (
              <button key={f} type="button" className={theme.headingFont === f ? "on" : ""} onClick={() => setTheme({ headingFont: f })}>
                {f === "serif" ? "Klassisch" : f === "sans" ? "Modern" : "Handschrift"}
              </button>
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={theme.dark} onChange={(e) => setTheme({ dark: e.target.checked })} />
            Dunkles Design
          </label>
        </div>
      </div>
    </div>
  );
}
