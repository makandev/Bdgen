"use client";

import { useState } from "react";
import { DISLIKE_REASONS, MAX_RETRIES } from "@/lib/learning";

export function RatingBar({
  attempt, aiReady, busy, onRate, onRetry,
}: {
  /** 0 = first version, 1–2 = after the AI tried again. */
  attempt: number;
  aiReady: boolean;
  busy: boolean;
  onRate: (value: 1 | -1, reasons: string[]) => void;
  onRetry: (reasons: string[], text: string) => void;
}) {
  const [phase, setPhase] = useState<"ask" | "liked" | "disliked" | "saved">("ask");
  const [reasons, setReasons] = useState<string[]>([]);
  const [text, setText] = useState("");
  const left = MAX_RETRIES - attempt;

  if (phase === "liked") {
    return <div className="rating done">👍 Danke! Gemerkt – so lernt Funkelpost, was dir gefällt.</div>;
  }
  if (phase === "saved") {
    return <div className="rating done">Danke für dein Feedback – Funkelpost merkt es sich für die nächsten Karten.</div>;
  }
  if (phase === "disliked") {
    return (
      <div className="rating open">
        <strong>Was passt nicht?</strong>
        <div className="chips">
          {DISLIKE_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`chip${reasons.includes(r) ? " on" : ""}`}
              onClick={() => setReasons(reasons.includes(r) ? reasons.filter((x) => x !== r) : [...reasons, r])}
            >
              {r}
            </button>
          ))}
        </div>
        <input type="text" value={text} maxLength={300} placeholder="Oder sag es in eigenen Worten (optional)" onChange={(e) => setText(e.target.value)} />
        <div className="row">
          {aiReady && left > 0 ? (
            <button
              type="button"
              className="btn sm"
              disabled={busy}
              onClick={() => {
                onRate(-1, reasons);
                onRetry(reasons, text.trim());
              }}
            >
              {busy ? <><span className="spinner" /> KI schreibt …</> : `✨ KI, überzeug mich nochmal (${left === 1 ? "letzter Versuch" : `noch ${left} Versuche`})`}
            </button>
          ) : (
            <span className="small muted">
              {aiReady ? "Die KI hatte ihre Chancen 🙂 – probier ein anderes Design, ergänze Stichworte oder passe Texte selbst an." : "Ohne KI kann ich keine neue Fassung schreiben."}
            </span>
          )}
          <button
            type="button"
            className="btn ghost sm"
            disabled={busy}
            onClick={() => {
              onRate(-1, reasons);
              setPhase("saved");
            }}
          >
            Nur Feedback speichern
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="rating">
      <span>{attempt > 0 ? <><b>Neue Fassung</b> (Versuch {attempt} von {MAX_RETRIES}) – besser?</> : "Wie gefällt dir die Karte?"}</span>
      <div className="row">
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => {
            onRate(1, []);
            setPhase("liked");
          }}
        >
          👍 Gefällt mir
        </button>
        <button type="button" className="btn ghost sm" onClick={() => setPhase("disliked")}>
          👎 Nicht so
        </button>
      </div>
    </div>
  );
}
