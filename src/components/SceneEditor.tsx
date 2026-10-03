"use client";

import { useState } from "react";
import type { Scene } from "@/lib/types";
import { List, Text } from "./fields";

export const SCENE_LABELS: Record<Scene["type"], string> = {
  greeting: "Begrüßung",
  text: "Textseite",
  quiz: "Quiz",
  list: "Liste",
  check: "Schein-Ende",
  finale: "Finale",
};

const QUICK = ["kürzer", "witziger", "herzlicher", "persönlicher", "förmlicher", "lockerer", "ganz neu"];

export function sceneSummary(s: Scene): string {
  switch (s.type) {
    case "greeting":
      return s.day.title;
    default:
      return s.title;
  }
}

export function SceneFields({ scene, onChange }: { scene: Scene; onChange: (s: Scene) => void }) {
  const up = <S extends Scene>(patch: Partial<S>) => onChange({ ...scene, ...patch } as Scene);
  const markup = "Tipp: {{name}} = Anrede, **fett**, Zeilenumbruch mit Enter";

  switch (scene.type) {
    case "greeting":
      return (
        <>
          <Text label="Kleine Zeile oben" value={scene.eyebrow} onChange={(v) => up({ eyebrow: v })} hint="Leer lassen = aktuelles Datum" />
          {(["morning", "day", "evening"] as const).map((k) => (
            <div className="sub" key={k}>
              <strong className="small">{k === "morning" ? "🌅 Morgens (bis 11 Uhr)" : k === "day" ? "☀️ Tagsüber" : "🌙 Abends (ab 17 Uhr)"}</strong>
              <Text label="Überschrift" value={scene[k].title} onChange={(v) => up({ [k]: { ...scene[k], title: v } })} />
              <Text label="Text" multiline value={scene[k].text} onChange={(v) => up({ [k]: { ...scene[k], text: v } })} />
            </div>
          ))}
          <Text label="Hinweis darunter" multiline value={scene.note} onChange={(v) => up({ note: v })} hint={markup} />
          <Text label="Button" value={scene.button} onChange={(v) => up({ button: v })} />
        </>
      );
    case "text":
      return (
        <>
          <Text label="Kleine Zeile oben" value={scene.eyebrow} onChange={(v) => up({ eyebrow: v })} />
          <Text label="Überschrift" value={scene.title} onChange={(v) => up({ title: v })} />
          <List label="Absätze" multiline items={scene.paragraphs} onChange={(v) => up({ paragraphs: v })} addLabel="+ Absatz" />
          <Text label="Leiser Zusatz (grau)" multiline value={scene.muted} onChange={(v) => up({ muted: v })} hint={markup} />
          <Text label="Button" value={scene.button} onChange={(v) => up({ button: v })} />
        </>
      );
    case "quiz":
      return (
        <>
          <Text label="Kleine Zeile oben" value={scene.eyebrow} onChange={(v) => up({ eyebrow: v })} />
          <Text label="Frage" value={scene.title} onChange={(v) => up({ title: v })} />
          <Text label="Text unter der Frage" multiline value={scene.text} onChange={(v) => up({ text: v })} />
          {scene.options.map((o, i) => (
            <div className="sub" key={i}>
              <div className="spread">
                <strong className="small">Antwort {i + 1}</strong>
                <label className="toggle" style={{ padding: "4px 8px" }}>
                  <input
                    type="radio"
                    checked={o.correct}
                    onChange={() => up({ options: scene.options.map((x, k) => ({ ...x, correct: k === i })) })}
                  />
                  die „richtige“
                </label>
              </div>
              <Text label="Antwort" value={o.label} onChange={(v) => up({ options: scene.options.map((x, k) => (k === i ? { ...x, label: v } : x)) })} />
              <Text label="Reaktion" multiline value={o.reply} onChange={(v) => up({ options: scene.options.map((x, k) => (k === i ? { ...x, reply: v } : x)) })} />
              {scene.options.length > 2 && (
                <div>
                  <button type="button" className="btn ghost sm" onClick={() => up({ options: scene.options.filter((_, k) => k !== i) })}>
                    Antwort entfernen
                  </button>
                </div>
              )}
            </div>
          ))}
          {scene.options.length < 4 && (
            <div>
              <button type="button" className="btn ghost sm" onClick={() => up({ options: [...scene.options, { label: "", reply: "", correct: false }] })}>
                + Antwort
              </button>
            </div>
          )}
          <Text label="Weiter-Button" value={scene.button} onChange={(v) => up({ button: v })} />
        </>
      );
    case "list":
      return (
        <>
          <Text label="Kleine Zeile oben" value={scene.eyebrow} onChange={(v) => up({ eyebrow: v })} />
          <Text label="Überschrift" value={scene.title} onChange={(v) => up({ title: v })} />
          <List label="Punkte (erscheinen nacheinander)" items={scene.items} onChange={(v) => up({ items: v })} max={7} addLabel="+ Punkt" />
          <div className="sub">
            <Text label="Hervorgehobener Punkt – Bezeichnung" value={scene.highlightLabel} onChange={(v) => up({ highlightLabel: v })} />
            <Text label="Hervorgehobener Punkt – Text" value={scene.highlight} onChange={(v) => up({ highlight: v })} />
          </div>
          <Text label="Button" value={scene.button} onChange={(v) => up({ button: v })} />
        </>
      );
    case "check":
      return (
        <>
          <Text label="Kleine Zeile oben" value={scene.eyebrow} onChange={(v) => up({ eyebrow: v })} />
          <Text label="Überschrift" value={scene.title} onChange={(v) => up({ title: v })} />
          <Text label="Text" multiline value={scene.text} onChange={(v) => up({ text: v })} hint={markup} />
          <Text label="Status-Siegel" value={scene.status} onChange={(v) => up({ status: v })} />
          <Text label="Kleingedrucktes" value={scene.tiny} onChange={(v) => up({ tiny: v })} />
          <Text label="Button" value={scene.button} onChange={(v) => up({ button: v })} />
        </>
      );
    case "finale":
      return (
        <>
          <Text label="Kleine Zeile oben" value={scene.eyebrow} onChange={(v) => up({ eyebrow: v })} />
          <Text label="Überschrift" value={scene.title} onChange={(v) => up({ title: v })} />
          <Text label="Zitat / Wunsch" multiline value={scene.quote} onChange={(v) => up({ quote: v })} />
          <List label="Absätze" multiline items={scene.paragraphs} onChange={(v) => up({ paragraphs: v })} addLabel="+ Absatz" />
          <Text label="Unterschrift" multiline value={scene.signature} onChange={(v) => up({ signature: v })} hint={markup} />
          <Text label="Status-Siegel" value={scene.status} onChange={(v) => up({ status: v })} />
          <Text label="Kleingedrucktes" value={scene.tiny} onChange={(v) => up({ tiny: v })} />
          <Text label="Button zum Kino-Finale" value={scene.cinemaButton} onChange={(v) => up({ cinemaButton: v })} />
        </>
      );
  }
}

export function SceneAI({
  busy, disabled, onRun,
}: {
  busy: boolean;
  disabled: boolean;
  onRun: (instruction: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="ai-box">
      <strong className="small">✨ Diese Seite mit KI ändern</strong>
      <div className="chips">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip" disabled={busy || disabled} onClick={() => onRun(q === "ganz neu" ? "" : `Mach den Text ${q}.`)}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onRun(text);
        }}
      >
        <input
          type="text"
          value={text}
          placeholder="z. B. „erwähne unseren Urlaub am See“"
          onChange={(e) => setText(e.target.value)}
          disabled={busy || disabled}
        />
        <button className="btn sm" disabled={busy || disabled || !text.trim()}>
          {busy ? <span className="spinner" /> : "Los"}
        </button>
      </form>
      {disabled && <small className="muted">KI ist nicht eingerichtet.</small>}
    </div>
  );
}
