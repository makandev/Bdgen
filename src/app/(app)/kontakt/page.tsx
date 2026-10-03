"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { errText } from "@/components/client";
import { TopBar } from "@/components/TopBar";
import { MOODS, NOTE_STARTERS, OCCASIONS, PRESETS, RELATIONS } from "@/lib/presets";
import { contactInput } from "@/lib/records";
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
  const [preset, setPreset] = useState("gold");
  const [extra, setExtra] = useState("");
  const [ai, setAi] = useState<boolean | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    repo.aiSource().then((s) => setAi(s !== "none")).catch(() => setAi(false));
    if (isNew) {
      setForm(EMPTY);
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

  async function save(): Promise<Contact | null> {
    setMsg(null);
    const input = contactInput(form);
    if (typeof input === "string") {
      setMsg({ kind: "err", text: input });
      return null;
    }
    try {
      const c = await repo.saveContact(isNew ? null : id, input);
      if (isNew) router.replace(`/kontakt/?id=${c.id}`);
      setMsg({ kind: "ok", text: "Gespeichert ✓" });
      return c;
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
      return null;
    }
  }

  async function createCard(mode: "ai" | "template") {
    setBusy("create");
    const contact = await save();
    if (!contact) return setBusy("");
    setMsg(null);
    try {
      const d = await repo.createCard(contact.id, { preset, mode, extra });
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
      router.push("/");
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
        <Link href="/" className="btn ghost sm hide-sm">← Übersicht</Link>
      </TopBar>

      <div className="editor" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,380px)" }}>
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

            <div className="row" style={{ alignItems: "flex-end" }}>
              <label className="field grow" style={{ minWidth: 180 }}>
                <span>Beziehung</span>
                <input
                  type="text"
                  list="relations"
                  value={form.relation}
                  placeholder="z. B. Schwester, Kollegin"
                  onChange={(e) => set("relation", e.target.value)}
                />
                <datalist id="relations">
                  {RELATIONS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </label>
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
              <h2>Was soll rüberkommen?</h2>
              <p className="muted small" style={{ margin: "4px 0 0" }}>
                Keine fertigen Texte nötig – schreib Situationen, Gefühle oder Kleinigkeiten. Die KI macht daraus die Karte.
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
              <span>Stichpunkte</span>
              <textarea
                ref={notesRef}
                rows={8}
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
              <h2>Design wählen</h2>
            </div>
            <div className="swatches">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button key={key} type="button" className={`swatch${preset === key ? " on" : ""}`} onClick={() => setPreset(key)}>
                  <div
                    className="sw"
                    style={{
                      background: `linear-gradient(135deg, ${p.theme.bg}, ${p.theme.bg2})`,
                      boxShadow: `inset 0 0 0 1px ${p.theme.accent}33`,
                    }}
                  >
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
                "✨ Karte mit KI erstellen"
              )}
            </button>
            <button className="btn ghost" onClick={() => createCard("template")} disabled={!!busy || !form.name.trim()}>
              Aus Vorlage erstellen
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
