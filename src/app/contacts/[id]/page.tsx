"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, errText } from "@/components/client";
import { TopBar } from "@/components/TopBar";
import { MOODS, NOTE_STARTERS, OCCASIONS, PRESETS, RELATIONS } from "@/lib/presets";
import type { Address, Card, Contact, Occasion } from "@/lib/types";

type Form = Pick<Contact, "name" | "relation" | "address" | "occasion" | "date" | "mood" | "notes">;

const EMPTY: Form = { name: "", relation: "", address: "du", occasion: "geburtstag", date: "", mood: ["herzlich", "witzig"], notes: "" };

export default function ContactPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [cards, setCards] = useState<Card[]>([]);
  const [loaded, setLoaded] = useState(isNew);
  const [busy, setBusy] = useState<"" | "save" | "create" | "delete">("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [preset, setPreset] = useState("gold");
  const [extra, setExtra] = useState("");
  const [ai, setAi] = useState<boolean | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api<{ providers: string[] }>("/api/status").then((d) => setAi(d.providers.length > 0)).catch(() => setAi(false));
    if (isNew) return;
    api<{ contact: Contact; cards: Card[] }>(`/api/contacts/${id}`)
      .then((d) => {
        const { name, relation, address, occasion, date, mood, notes } = d.contact;
        setForm({ name, relation, address, occasion, date, mood, notes });
        setCards(d.cards);
        setLoaded(true);
      })
      .catch((e) => setMsg({ kind: "err", text: errText(e) }));
  }, [id, isNew]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save(): Promise<string | null> {
    setBusy("save");
    setMsg(null);
    try {
      const d = await api<{ contact: Contact }>(isNew ? "/api/contacts" : `/api/contacts/${id}`, {
        method: isNew ? "POST" : "PUT",
        body: form,
      });
      if (isNew) router.replace(`/contacts/${d.contact.id}`);
      setMsg({ kind: "ok", text: "Gespeichert." });
      return d.contact.id;
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
      return null;
    } finally {
      setBusy("");
    }
  }

  async function createCard(mode: "ai" | "template") {
    const contactId = await save();
    if (!contactId) return;
    setBusy("create");
    setMsg(null);
    try {
      const d = await api<{ card: Card; warning?: string }>("/api/cards", { body: { contactId, preset, mode, extra } });
      if (d.warning) sessionStorage.setItem("bdgen-warning", d.warning);
      router.push(`/cards/${d.card.id}`);
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
      setBusy("");
    }
  }

  async function remove() {
    if (!confirm(`„${form.name}“ und alle zugehörigen Karten wirklich löschen?`)) return;
    setBusy("delete");
    await api(`/api/contacts/${id}`, { method: "DELETE" }).catch(() => {});
    router.push("/");
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

  function copyLink(c: Card) {
    navigator.clipboard?.writeText(`${window.location.origin}/k/${c.slug}`);
    setMsg({ kind: "ok", text: "Link kopiert." });
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
            <div className="eyebrow">{isNew ? "Neuer Kontakt" : "Kontakt"}</div>
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
              <small>So wird die Person in der Karte angesprochen. Dieser Name wird nie an die KI geschickt.</small>
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
              {busy === "save" ? <span className="spinner" /> : "Speichern"}
            </button>
            {!isNew && (
              <button className="btn danger" onClick={remove} disabled={!!busy}>
                Löschen
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
            {ai === false && <p className="muted small" style={{ margin: 0 }}>KI ist nicht eingerichtet (kein API-Schlüssel).</p>}
          </section>

          {cards.length > 0 && (
            <section className="panel stack">
              <h2>Karten</h2>
              {cards.map((c) => (
                <div key={c.id} className="spread" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                  <div>
                    <strong>{c.title}</strong>
                    <div className="muted small">
                      {new Date(c.updatedAt).toLocaleDateString("de-DE")} · {c.shared ? "Link aktiv" : "Link deaktiviert"}
                    </div>
                  </div>
                  <div className="row">
                    {c.shared && (
                      <button className="btn ghost sm" onClick={() => copyLink(c)}>
                        Link
                      </button>
                    )}
                    <Link className="btn sm" href={`/cards/${c.id}`}>
                      Bearbeiten
                    </Link>
                  </div>
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
