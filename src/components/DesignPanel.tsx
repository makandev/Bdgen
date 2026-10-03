"use client";

import { useState } from "react";
import { BACKDROP_LABELS, CONFETTI_LABELS, FONT_LABELS, presetEffects, presetTheme, STYLE_LABELS } from "@/lib/presets";
import type { Backdrop, CardStyle, ConfettiShape, Effects, HeadingFont, ParticleMotion, Particles, Theme } from "@/lib/types";
import { PresetGrid } from "./Swatch";

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
  ["ambient", "Hintergrund", 0, 2],
  ["speed", "Tempo", 0.5, 1.6],
];

const STYLE_IDEAS = [
  "Silvester mit buntem Feuerwerk",
  "Ballons, die aufsteigen",
  "leiser Schneefall",
  "mehr Konfetti, festlicher",
  "ruhiger und edler",
  "wie im Film Matrix",
  "wie in einem Videospiel",
  "schwarz-gold und luxuriös",
  "wie ein Sonnenuntergang",
  "verspielt für Kinder",
];

const MOTION_LABELS: Record<ParticleMotion, string> = { rise: "steigt auf", fall: "fällt", float: "schwebt", swirl: "wirbelt", pop: "ploppt" };

const RECIPES: [string, Particles][] = [
  ["🎈 Ballons", { emoji: ["🎈", "🎈", "🎉"], motion: "rise", amount: 1.2, size: 1.2 }],
  ["❄️ Schnee", { emoji: ["❄️", "❅", "✦"], motion: "fall", amount: 1.5, size: 0.9 }],
  ["🌸 Blüten", { emoji: ["🌸", "🌷", "💮"], motion: "swirl", amount: 1.2, size: 1 }],
  ["💖 Herzen", { emoji: ["💖", "💗"], motion: "pop", amount: 1.3, size: 1.1 }],
  ["🦋 Schmetterlinge", { emoji: ["🦋"], motion: "float", amount: 1, size: 1 }],
];

/** The AI's "effect recipe": emoji that move in one of five ways. Quick picks + what the AI invented. */
function ParticleChoice({ value, onChange }: { value: Particles | null | undefined; onChange: (p: Particles | null) => void }) {
  const same = (p: Particles) => !!value && value.motion === p.motion && value.emoji.join() === p.emoji.join();
  return (
    <div className="field">
      <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>Emoji-Effekt (die KI kann eigene erfinden)</span>
      <div className="chips">
        <button type="button" className={`chip${!value ? " on" : ""}`} onClick={() => onChange(null)}>aus</button>
        {RECIPES.map(([label, p]) => (
          <button key={label} type="button" className={`chip${same(p) ? " on" : ""}`} onClick={() => onChange(p)}>{label}</button>
        ))}
        {value && !RECIPES.some(([, p]) => same(p)) && <span className="chip on">✨ {value.emoji.join(" ")}</span>}
      </div>
      {value && (
        <div className="chips">
          {(Object.keys(MOTION_LABELS) as ParticleMotion[]).map((m) => (
            <button key={m} type="button" className={`chip${value.motion === m ? " on" : ""}`} onClick={() => onChange({ ...value, motion: m })}>{MOTION_LABELS[m]}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div className="field">
      <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>{label}</span>
      <div className="chips">
        {(Object.keys(options) as T[]).map((k) => (
          <button key={k} type="button" className={`chip${value === k ? " on" : ""}`} onClick={() => onChange(k)}>
            {options[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

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
      <div className="ai-hero">
        <h2>✨ Sag der KI, wie es aussehen soll</h2>
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
            placeholder="z. B. „Farben wie Lavendel, Herzen statt Konfetti“"
            onChange={(e) => setPrompt(e.target.value)}
            style={{ flex: 1, minWidth: 160 }}
          />
          <button className="btn sm" disabled={busy || !prompt.trim()}>
            {busy ? <span className="spinner" /> : "Los"}
          </button>
        </form>
        {!aiReady && <small className="muted">Ohne KI werden einfache Wünsche erkannt (z. B. „Matrix“, „bunt“, „mehr Konfetti“).</small>}
      </div>

      <div>
        <h3 style={{ marginBottom: 8 }}>Oder eine Vorlage antippen</h3>
        <PresetGrid
          value={theme.preset}
          onPick={(key) => onChange(presetTheme(key), { ...presetEffects(key), cinema: effects.cinema, clock: effects.clock, progress: effects.progress })}
        />
      </div>

      <details className="optional">
        <summary>🎛️ Feineinstellungen (optional)</summary>
        <div className="inner">
          <Choice<CardStyle> label="Kartenstil" value={theme.style ?? "glass"} options={STYLE_LABELS} onChange={(v) => setTheme({ style: v })} />
          <Choice<Backdrop> label="Hintergrund-Effekt" value={effects.backdrop ?? "dots"} options={BACKDROP_LABELS} onChange={(v) => setFx({ backdrop: v })} />
          <Choice<ConfettiShape> label="Konfetti-Form" value={effects.confettiShape ?? "strip"} options={CONFETTI_LABELS} onChange={(v) => setFx({ confettiShape: v })} />
          <ParticleChoice value={effects.particles} onChange={(p) => setFx({ particles: p })} />
          <Choice<HeadingFont> label="Schrift" value={theme.headingFont} options={FONT_LABELS} onChange={(v) => setTheme({ headingFont: v })} />

          <div className="stack" style={{ gap: 10 }}>
            {SLIDERS.map(([k, label, min, max]) => (
              <label key={k} className="slider">
                <span>{label}</span>
                <input type="range" min={min} max={max} step={0.1} value={effects[k] as number} onChange={(e) => setFx({ [k]: Number(e.target.value) })} />
                <span className="muted small">
                  {k === "speed" ? `${(effects[k] as number).toFixed(1)}×` : (effects[k] as number) === 0 ? "aus" : (effects[k] as number).toFixed(1)}
                </span>
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

          <div className="color-grid">
            {COLORS.map(([k, label]) => (
              <label key={k}>
                <input type="color" value={theme[k] as string} onChange={(e) => setTheme({ [k]: e.target.value })} />
                {label}
              </label>
            ))}
          </div>
          <div className="field">
            <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>Konfetti-Farben</span>
            <div className="row">
              {theme.confetti.map((c, i) => (
                <input key={i} type="color" value={c} onChange={(e) => setTheme({ confetti: theme.confetti.map((x, k) => (k === i ? e.target.value : x)) })} />
              ))}
              {theme.confetti.length < 8 && (
                <button type="button" className="btn ghost sm icon" onClick={() => setTheme({ confetti: [...theme.confetti, theme.accent] })}>+</button>
              )}
              {theme.confetti.length > 1 && (
                <button type="button" className="btn ghost sm icon" onClick={() => setTheme({ confetti: theme.confetti.slice(0, -1) })}>−</button>
              )}
            </div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={theme.dark} onChange={(e) => setTheme({ dark: e.target.checked })} />
            Dunkles Design
          </label>
        </div>
      </details>
    </div>
  );
}
