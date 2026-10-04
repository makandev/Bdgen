"use client";

import { HOME } from "@/lib/base";
import { withGenerated } from "@/lib/cardbase";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { errText, copyText } from "@/components/client";
import { RatingBar } from "@/components/RatingBar";
import { RelationPicker } from "@/components/RelationPicker";
import { TopBar } from "@/components/TopBar";
import { relationGroup, suggestMood, suggestPreset } from "@/lib/learning";
import { OCCASIONS, PRESETS, relationEmoji } from "@/lib/presets";
import { answersToNotes, questionsFor, showQuestion } from "@/lib/questions";
import { renderCardHTML } from "@/lib/render";
import { buildRating, repo } from "@/lib/repo";
import type { Address, Card, CardData, Contact, Occasion } from "@/lib/types";

const QUICK_RELATIONS = ["Mama", "Papa", "Tochter", "Sohn", "Oma", "Opa", "Partnerin", "Partner", "Schwester", "Bruder", "Beste Freundin", "Bester Freund", "Kollegin", "Kollege"];
const FORMAL_GROUPS = ["Arbeit", "Schule & Kita", "Gesundheit & Alltag"];
const WAIT_LINES = ["Die KI sucht die schönsten Worte …", "Konfetti wird sortiert …", "Ein bisschen Glitzer kommt noch drauf …", "Gleich fertig …"];

export default function QuickCard() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [moreRelations, setMoreRelations] = useState(false);
  const [occasion, setOccasion] = useState<Occasion>("geburtstag");
  const [address, setAddress] = useState<Address>("du");
  const [answers, setAnswers] = useState(["", ""]);
  const [gift, setGift] = useState("");
  const [showGift, setShowGift] = useState(false);
  const [error, setError] = useState("");
  const [waitLine, setWaitLine] = useState(0);
  const [result, setResult] = useState<{ card: Card; data: CardData; contact: Contact } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [ratingKey, setRatingKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [aiReady, setAiReady] = useState(true);

  useEffect(() => {
    repo.aiSource().then((s) => setAiReady(s !== "none")).catch(() => setAiReady(false));
  }, []);
  useEffect(() => {
    if (step !== 3 || result) return;
    const t = setInterval(() => setWaitLine((i) => (i + 1) % WAIT_LINES.length), 2200);
    return () => clearInterval(t);
  }, [step, result]);

  const questions = useMemo(() => questionsFor(relation, occasion), [relation, occasion]);
  const html = useMemo(() => (result ? renderCardHTML(result.data, { reactionMode: "preview" }) : ""), [result]);

  function pickRelation(r: string) {
    setRelation(r);
    setAddress(FORMAL_GROUPS.includes(relationGroup(r)) ? "sie" : "du");
  }

  function toggleHint(i: number, hint: string) {
    setAnswers((a) => a.map((v, k) => {
      if (k !== i) return v;
      const parts = v.split(/,\s*/).filter(Boolean);
      return (parts.includes(hint) ? parts.filter((p) => p !== hint) : [...parts, hint]).join(", ");
    }));
  }

  const createdId = useRef<string | null>(null);

  async function create() {
    setStep(3);
    setError("");
    try {
      const ratings = await repo.listRatings().catch(() => []);
      // A retry after an error reuses the person created the first time instead of adding a second one.
      const contact = await repo.saveContact(createdId.current, {
        name: name.trim(),
        relation: relation.trim(),
        address,
        occasion,
        date: "",
        events: [],
        mood: suggestMood(relation),
        notes: answersToNotes(questions.map((q, i) => ({ q: q.q, a: answers[i] }))),
      });
      createdId.current = contact.id;
      const preset = suggestPreset(relation, occasion, ratings);
      const r = await repo.createCard(contact.id, { preset, mode: aiReady ? "ai" : "template", extra: "", gift: showGift ? gift : "" });
      if (r.warning) setError(r.warning);
      setResult({ card: r.card, data: r.card.data, contact });
    } catch (e) {
      setError(errText(e));
      setStep(2);
    }
  }

  function rate(value: 1 | -1, reasons: string[]) {
    if (!result) return;
    repo.addRating(buildRating(result.card, result.data, result.contact, { value, reasons, attempt })).catch(() => {});
  }

  async function retry(reasons: string[], text: string) {
    if (!result) return;
    setBusy(true);
    setError("");
    try {
      const g = await repo.generate(result.card, "", { reasons, text, previous: result.data });
      const data: CardData = withGenerated(result.data, g);
      const card = await repo.saveCard(result.card.id, { data });
      setResult({ ...result, card, data });
      setAttempt((a) => a + 1);
      setRatingKey((k) => k + 1);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!result) return;
    const link = await repo.shareLink(result.card, result.data);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url: link });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    if (await copyText(link)) {
      setError("");
      alert("Link kopiert – jetzt einfach in WhatsApp, SMS oder eine Mail einfügen.");
    } else {
      setError(`Kopieren ging hier nicht – bitte diesen Link markieren und kopieren: ${link}`);
    }
  }

  return (
    <div className="shell">
      <TopBar>
        <Link href={HOME} className="btn ghost sm hide-sm">← Übersicht</Link>
      </TopBar>
      <div className="quick stack">
        <div className="quick-steps" aria-hidden="true">
          {[1, 2, 3].map((n) => <span key={n} className={step >= n ? "on" : ""} />)}
        </div>

        {step === 1 && (
          <section className="panel stack">
            <div className="eyebrow" style={{ textAlign: "center" }}>⚡ Schnell-Karte</div>
            <h1>Für wen ist die Überraschung?</h1>
            <input className="big-input" type="text" value={name} autoFocus placeholder="Name, z. B. Lena oder Oma" onChange={(e) => setName(e.target.value)} />
            <div className="field">
              <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>Wer ist das für dich?</span>
              <div className="chips">
                {QUICK_RELATIONS.map((r) => (
                  <button key={r} type="button" className={`chip${relation === r ? " on" : ""}`} onClick={() => pickRelation(r)}>
                    {relationEmoji(r)} {r}
                  </button>
                ))}
                <button type="button" className="chip" onClick={() => setMoreRelations(!moreRelations)}>{moreRelations ? "weniger ▴" : "mehr …"}</button>
              </div>
              {moreRelations && <RelationPicker value={relation} onChange={pickRelation} />}
            </div>
            <div className="field">
              <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>Wofür?</span>
              <div className="chips">
                {OCCASIONS.map((o) => (
                  <button key={o.id} type="button" className={`chip${occasion === o.id ? " on" : ""}`} onClick={() => setOccasion(o.id)}>
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="seg">
                {(["du", "sie"] as Address[]).map((a) => (
                  <button key={a} type="button" className={address === a ? "on" : ""} onClick={() => setAddress(a)}>
                    {a === "du" ? "du" : "Sie"}
                  </button>
                ))}
              </div>
              <button className="btn" disabled={!name.trim() || !relation.trim()} onClick={() => setStep(2)}>Weiter →</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="panel stack">
            <div className="eyebrow" style={{ textAlign: "center" }}>{relationEmoji(relation)} {name}</div>
            <h1>Erzähl kurz …</h1>
            <p className="muted small" style={{ margin: 0, textAlign: "center" }}>Tippe Ideen an oder schreib ein paar Worte. Die zweite Frage kannst du auch leer lassen.</p>
            {questions.map((q, i) => (
              <div key={q.q} className="stack" style={{ gap: 8 }}>
                <div className="q">{showQuestion(q.q, name)}</div>
                <div className="chips">
                  {q.hints.map((h) => (
                    <button key={h} type="button" className={`chip${answers[i].split(/,\s*/).includes(h) ? " on" : ""}`} onClick={() => toggleHint(i, h)}>
                      {h}
                    </button>
                  ))}
                </div>
                <textarea rows={2} value={answers[i]} placeholder="… oder in eigenen Worten" onChange={(e) => setAnswers((a) => a.map((v, k) => (k === i ? e.target.value : v)))} />
              </div>
            ))}
            {showGift ? (
              <label className="gift-quick">
                <span aria-hidden="true">🎁</span>
                <input type="text" value={gift} autoFocus placeholder="Was schenkst du? z. B. Konzertkarten" onChange={(e) => setGift(e.target.value)} />
              </label>
            ) : (
              <button type="button" className="linklike" onClick={() => setShowGift(true)}>🎁 Ich schenke auch etwas</button>
            )}
            {error && <div className="notice err">{error}</div>}
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button className="btn ghost" onClick={() => setStep(1)}>← Zurück</button>
              <button className="btn" disabled={!answers[0].trim() && !answers[1].trim()} onClick={create}>✨ Karte zaubern</button>
            </div>
            {!aiReady && <p className="muted small" style={{ margin: 0 }}>Hinweis: Die KI ist nicht eingerichtet – es wird eine Vorlage verwendet.</p>}
          </section>
        )}

        {step === 3 && !result && (
          <section className="panel empty stack">
            <div className="big">✦ ✧ ✦</div>
            <span className="spinner" style={{ justifySelf: "center", width: 28, height: 28 }} />
            <h2>{WAIT_LINES[waitLine]}</h2>
          </section>
        )}

        {step === 3 && result && (
          <section className="stack">
            <div style={{ textAlign: "center" }}>
              <div className="eyebrow">Fertig! · {PRESETS[result.data.theme.preset]?.label ?? "Eigenes Design"}</div>
              <h1>Die Überraschung für {result.data.recipientName}</h1>
            </div>
            <div className="quick-preview">
              <iframe key={ratingKey} title="Vorschau" srcDoc={html} sandbox="allow-scripts allow-downloads allow-popups" />
            </div>
            {error && <div className="notice err">{error}</div>}
            <RatingBar key={ratingKey} attempt={attempt} aiReady={aiReady} busy={busy} onRate={rate} onRetry={retry} />
            <div className="row" style={{ justifyContent: "center" }}>
              <button className="btn" onClick={share}>📨 Link teilen</button>
              <Link className="btn ghost" href={`/karte/?id=${result.card.id}`}>✏️ Weiter anpassen</Link>
              <button className="btn ghost" onClick={() => { setResult(null); setStep(1); setName(""); setRelation(""); setAnswers(["", ""]); setGift(""); setShowGift(false); setAttempt(0); }}>
                Noch eine Karte
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
