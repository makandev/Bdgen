"use client";

import { useState } from "react";

const STEPS = [
  {
    icon: "🎁",
    title: "Willkommen!",
    text: "Hier bastelst du kleine digitale Überraschungen für Menschen, die du magst – zum Geburtstag, zum Danke-Sagen oder einfach so.",
  },
  {
    icon: "👤",
    title: "1. Person anlegen",
    text: "Tippe auf „Neue Person“. Schreib, wie du die Person nennst – zum Beispiel „Oma“ oder „Lena“ – und wofür die Überraschung ist.",
  },
  {
    icon: "💭",
    title: "2. Ein bisschen erzählen",
    text: "Was magst du an der Person? Was habt ihr zusammen erlebt? Du musst keine schönen Sätze schreiben – ein paar Stichworte reichen völlig.",
  },
  {
    icon: "✨",
    title: "3. Zaubern lassen",
    text: "Tippe auf „Karte mit KI erstellen“. Die KI schreibt daraus eine Karte mit Konfetti und Überraschungen. Gefällt dir etwas nicht? Sag einfach, was anders sein soll.",
  },
  {
    icon: "📨",
    title: "4. Verschicken",
    text: "Tippe auf „Link teilen“ und schick ihn per WhatsApp, SMS oder Mail. Fertig! Deine Daten bleiben übrigens nur auf diesem Gerät.",
  },
];

export function Intro({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="intro-backdrop" role="dialog" aria-modal="true" aria-label="Einführung">
      <div className="intro panel">
        <button className="intro-skip" onClick={onClose}>Überspringen</button>
        <div className="intro-icon" aria-hidden="true">{s.icon}</div>
        <h2>{s.title}</h2>
        <p>{s.text}</p>
        <div className="intro-dots" aria-hidden="true">
          {STEPS.map((_, k) => (
            <span key={k} className={k === i ? "on" : ""} />
          ))}
        </div>
        <div className="row" style={{ justifyContent: "center" }}>
          {i > 0 && (
            <button className="btn ghost" onClick={() => setI(i - 1)}>
              ← Zurück
            </button>
          )}
          <button className="btn" onClick={() => (last ? onClose() : setI(i + 1))} autoFocus>
            {last ? "Los geht’s! 🎉" : "Weiter →"}
          </button>
        </div>
      </div>
    </div>
  );
}
