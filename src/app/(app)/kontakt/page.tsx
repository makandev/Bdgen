"use client";

import { HOME } from "@/lib/base";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { errText } from "@/components/client";
import { TopBar } from "@/components/TopBar";
import { MOODS, NOTE_STARTERS, OCCASIONS, PRESETS } from "@/lib/presets";
import { RelationPicker } from "@/components/RelationPicker";
import { PresetGrid } from "@/components/Swatch";
import { Thumb } from "@/components/Thumb";
import { EXAMPLES } from "@/lib/examples";
import { contactInput, NOTES_MAX } from "@/lib/records";
import { repo } from "@/lib/repo";
import type { Address, Card, Contact, Occasion } from "@/lib/types";

type Form = Pick<Contact, "name" | "relation" | "address" | "occasion" | "date" | "mood" | "notes">;

const EMPTY: Form = { name: "", relation: "", address: "du", occasion: "geburtstag", date: "", mood: ["herzlich", "witzig"], notes: "" };

export default function ContactPage() {
  return (
    <Suspense>
      <ContactEditor />
    </Suspense>
  );
}

function ContactEditor() {
  const id = useSearchParams().get("id") ?? "neu";
  const isNew = id === "neu";
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [cards, setCards] = useState<Card[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<"" | "create">("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const params = useSearchParams();
  const [example, setExample] = useState(() => EXAMPLES.find((e) => e.id === params.get("vorlage")) ?? null);
  const [preset, setPreset] = useState(() => {
    const d = example?.preset ?? params.get("design");
    return d && PRESETS[d] ? d : "gold";
  });
  const [extra, setExtra] = useState("");
  const [gift, setGift] = useState("");
  const [ai, setAi] = useState<boolean | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    repo.aiSource().then((s) => setAi(s !== "none")).catch(() => setAi(false));
    if (isNew) {
      const ex = EXAMPLES.find((e) => e.id === new URLSearchParams(window.location.search).get("vorlage"));
      setForm(ex ? { ...EMPTY, relation: ex.relation, occasion: ex.occasion, address: ex.address } : EMPTY);
      setCards([]);
      setLoaded(true);
      return;
    }
    let alive = true;
    repo.getContact(id).then((r) => {
      if (!alive) return;
      if (!r) {
        setMsg({ kind: "err", text: "Diese Person gibt es nicht (mehr)." });
        return;
      }
      const { name, relation, address, occasion, date, mood, notes } = r.contact;
      setForm({ name, relation, address, occasion, date, mood, notes });
      setCards(r.cards);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const saving = useRef<Promise<Contact> | null>(null);
  const savedId = useRef<string | null>(null);
  useEffect(() => {
    savedId.current = null;
  }, [id]);

  async function save(): Promise<Contact | null> {
    setMsg(null);
    const input = contactInput(form);
    if (typeof input === "string") {
      setMsg({ kind: "err", text: input });
      return null;
    }
    // A double click must not create the person twice: wait for the first save and reuse its id.
    if (saving.current) return saving.current;
    const run = (async () => {
      const c = await repo.saveContact(isNew && !savedId.current ? null : (savedId.current ?? id), input);
      savedId.current = c.id;
      if (isNew) router.replace(`/kontakt/?id=${c.id}`);
      return c;
    })();
    saving.current = run;
    try {
      const c = await run;
      setMsg({ kind: "ok", text: "Gespeichert ✓" });
      return c;
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
      return null;
    } finally {
      saving.current = null;
    }
  }

  async function createCard(mode: "ai" | "template") {
    setBusy("create");
    const contact = await save();
    if (!contact) return setBusy("");
    setMsg(null);
    try {
      const d = await repo.createCard(contact.id, { preset, mode, extra, example: example?.id, gift });
      if (d.warning) sessionStorage.setItem("bdgen-warning", d.warning);
      router.push(`/karte/?id=${d.card.id}`);
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
      setBusy("");
    }
  }

  async function remove() {
    if (!confirm(`„${form.name}“ und alle Karten für diese Person wirklich löschen?`)) return;
    try {
      await repo.deleteContact(id);
      router.push(HOME);
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    }
  }

  function addStarter(s: string) {
    const cur = form.notes.trimEnd();
    const next = (cur ? cur + "\n" : "") + s;
    set("notes", next);
    requestAnimationFrame(() => {
      const el = notesRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(next.length, next.length);
      }
    });
  }

  if (!loaded) {
    return (
      <div className="shell">
        <TopBar />
        {msg ? <div className="notice err">{msg.text}</div> : <p className="muted">Lädt …</p>}
      </div>
    );
  }

  return (
    <div className="shell">
      <TopBar>
        <Link href={HOME} className="btn ghost sm hide-sm">← Übersicht</Link>
      </TopBar>

      <div className="editor contact-layout">
        <div className="stack">
          <div>
            <div className="eyebrow">{isNew ? "Neue Person" : "Person"}</div>
            <h1>{form.name || "Wer ist es?"}</h1>
          </div>

          <section className="panel stack">
            <label className="field">
              <span>Name bzw. Anrede in der Karte</span>
              <input
                type="text"
                value={form.name}
                placeholder="z. B. Mama, Lena, Frau Muster"
                onChange={(e) => set("name", e.target.value)}
              />
              <small>So wird die Person in der Karte angesprochen. Der Name wird nie an die KI geschickt.</small>
            </label>

            <RelationPicker value={form.relation} onChange={(v) => set("relation", v)} />

            <div className="row" style={{ alignItems: "flex-end" }}>
              <div className="field">
                <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>Anrede</span>
                <div className="seg">
                  {(["du", "sie"] as Address[]).map((a) => (
                    <button key={a} type="button" className={form.address === a ? "on" : ""} onClick={() => set("address", a)}>
                      {a === "du" ? "du" : "Sie"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="row" style={{ alignItems: "flex-end" }}>
              <label className="field grow" style={{ minWidth: 180 }}>
                <span>Anlass</span>
                <select value={form.occasion} onChange={(e) => set("occasion", e.target.value as Occasion)}>
                  {OCCASIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.emoji} {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" style={{ minWidth: 170 }}>
                <span>Datum (optional)</span>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </label>
            </div>
          </section>

          <section className="panel stack">
            <div>
              <h2>✨ Erzähl der KI von der Person</h2>
              <p className="muted small" style={{ margin: "4px 0 0" }}>
                Du schreibst keine Karte – nur ein paar Stichworte: Situationen, Gefühle, Kleinigkeiten. Die KI macht daraus die ganze Karte.
              </p>
            </div>
            <div className="tip">
              <span aria-hidden="true">💡</span>
              <span>
                <b>So geht’s:</b> Schreib einfach auf, was dir einfällt – z. B. <i>„backt den besten Kuchen“</i> oder{" "}
                <i>„war für mich da, als ich krank war“</i>. Die Knöpfe unter dem Feld helfen beim Anfangen.
              </span>
            </div>
            <div className="field">
              <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>Stimmung</span>
              <div className="chips">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`chip${form.mood.includes(m) ? " on" : ""}`}
                    onClick={() => set("mood", form.mood.includes(m) ? form.mood.filter((x) => x !== m) : [...form.mood, m])}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              <span>Stichworte</span>
              <textarea
                ref={notesRef}
                rows={8}
                maxLength={NOTES_MAX}
                value={form.notes}
                placeholder={
                  "z. B.\n– ist immer für alle da und vergisst sich dabei selbst\n– wir lachen jedes Mal über den kaputten Kaffeeautomaten\n– hatte ein anstrengendes Jahr, hat es aber super gemeistert\n– liebt ihren Garten und schlechte Wortwitze"
                }
                onChange={(e) => set("notes", e.target.value)}
              />
            </label>
            <div className="chips">
              {NOTE_STARTERS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => addStarter(s)}>
                  + {s.replace(/: $/, "")}
                </button>
              ))}
            </div>
          </section>

          {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}

          <div className="row">
            <button className="btn ghost" onClick={save} disabled={!!busy || !form.name.trim()}>
              Speichern
            </button>
            {!isNew && (
              <button className="btn danger" onClick={remove} disabled={!!busy}>
                Person löschen
              </button>
            )}
          </div>
        </div>

        <aside className="stack editor-side" style={{ display: "grid" }}>
          <section className="panel stack">
            <div>
              <div className="eyebrow">Neue Karte</div>
              <h2>{example ? "Deine Vorlage" : "Design wählen"}</h2>
            </div>
            {example ? (
              <div className="template-banner">
                <Thumb e={example} small />
                <div className="stack" style={{ gap: 6 }}>
                  <strong>{example.title}</strong>
                  <span className="tag" style={{ justifySelf: "start" }}>{PRESETS[preset]?.label ?? PRESETS[example.preset].label}</span>
                  <span className="muted small">Design, Effekte und Aufbau werden übernommen – die KI schreibt die Texte neu für deine Person.</span>
                  <div className="row">
                    <Link href="/beispiele/" className="btn ghost sm">Andere Vorlage</Link>
                    <button type="button" className="btn ghost sm" onClick={() => setExample(null)}>Ohne Vorlage</button>
                  </div>
                </div>
              </div>
            ) : null}
            {example ? (
              <details className="optional">
                <summary>🎨 Anderes Design für diese Vorlage (optional)</summary>
                <div className="inner">
                  <PresetGrid value={preset} onPick={setPreset} />
                </div>
              </details>
            ) : (
              <>
                <PresetGrid value={preset} onPick={setPreset} />
                <Link href="/beispiele/" className="small">👀 Oder eine fertige Vorlage aus den Beispielen nehmen →</Link>
              </>
            )}
            <label className="field">
              <span>🎁 Schenkst du etwas dazu? (optional)</span>
              <input type="text" value={gift} placeholder="z. B. Konzertkarten, ein Wellness-Tag" onChange={(e) => setGift(e.target.value)} />
              <small>Dann bekommt die Karte eine Seite mit einem Päckchen zum Auspacken. Einen Gutschein (Code, Foto oder PDF) mit Feuerwerk-Show kannst du danach im Editor auf der Geschenk-Seite anhängen.</small>
            </label>
            <label className="field">
              <span>Besonderer Wunsch an die KI (optional)</span>
              <input
                type="text"
                value={extra}
                placeholder="z. B. „eher kurz“, „mit Garten-Anspielungen“"
                onChange={(e) => setExtra(e.target.value)}
              />
            </label>
            <button className="btn" onClick={() => createCard("ai")} disabled={!!busy || !form.name.trim() || ai === false}>
              {busy === "create" ? (
                <>
                  <span className="spinner" /> KI schreibt …
                </>
              ) : (
                example ? "✨ Mit KI für diese Person schreiben" : "✨ Karte mit KI erstellen"
              )}
            </button>
            <button
              type="button"
              className="linklike small"
              onClick={() => createCard("template")}
              disabled={!!busy || !form.name.trim()}
            >
              {example ? "oder Vorlage 1:1 übernehmen (nur den Namen einsetzen)" : "oder ohne KI mit einer Vorlage starten"}
            </button>
            {ai === false && (
              <p className="muted small" style={{ margin: 0 }}>
                Die KI ist noch nicht eingerichtet. <Link href="/einstellungen/">Mehr dazu →</Link>
              </p>
            )}
          </section>

          {cards.length > 0 && (
            <section className="panel stack">
              <h2>Karten</h2>
              {cards.map((c) => (
                <div key={c.id} className="spread" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                  <div>
                    <strong>{c.title}</strong>
                    <div className="muted small">Zuletzt geändert {new Date(c.updatedAt).toLocaleDateString("de-DE")}</div>
                  </div>
                  <Link className="btn sm" href={`/karte/?id=${c.id}`}>
                    Öffnen
                  </Link>
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
