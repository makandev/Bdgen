"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { errText } from "@/components/client";
import { DayPicker } from "@/components/ExtraDates";
import { TopBar } from "@/components/TopBar";
import { DATE_KINDS, entries, NO_YEAR, toICS, whenLabel, yearsLabel, type Entry } from "@/lib/organizer";
import { contactInput } from "@/lib/records";
import { repo, type ContactRow } from "@/lib/repo";

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const LEAD_KEY = "bdgen:v1:organizer-lead";

type Filter = "alle" | "geburtstage" | "andere";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function Organizer() {
  const [rows, setRows] = useState<ContactRow[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("alle");
  const [q, setQ] = useState("");
  const [lead, setLead] = useState(3);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => repo.listContacts().then(setRows).catch((e) => setError(errText(e)));
  useEffect(() => {
    load();
    try {
      const raw = localStorage.getItem(LEAD_KEY);
      if (raw !== null && [0, 1, 3, 7, 14].includes(Number(raw))) setLead(Number(raw));
    } catch {}
  }, []);

  const all = useMemo(() => entries(rows ?? []), [rows]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter(
      (e) =>
        (filter === "alle" || (filter === "geburtstage") === e.birthday) &&
        (!s || `${e.name} ${e.relation} ${e.label}`.toLowerCase().includes(s)),
    );
  }, [all, filter, q]);

  const byMonth = useMemo(() => {
    const groups: { title: string; items: Entry[] }[] = [];
    for (const e of shown) {
      const title = `${MONTHS[e.next.getMonth()]} ${e.next.getFullYear()}`;
      const g = groups[groups.length - 1];
      if (g && g.title === title) g.items.push(e);
      else groups.push({ title, items: [e] });
    }
    return groups;
  }, [shown]);

  const week = all.filter((e) => e.days <= 7).length;
  const month = all.filter((e) => e.days <= 30).length;
  const noDate = (rows ?? []).filter((c) => !c.date && !(c.events ?? []).length);
  const next = all[0];

  const setLeadSaved = (v: number) => {
    setLead(v);
    try {
      localStorage.setItem(LEAD_KEY, String(v));
    } catch {}
  };

  return (
    <div className="shell">
      <TopBar>
        <button className="btn sm" onClick={() => setAdding((a) => !a)}>{adding ? "Schließen" : "+ Datum vormerken"}</button>
      </TopBar>

      <div className="stack">
        <div>
          <div className="eyebrow">Geburtstags-Organizer</div>
          <h1>Nie wieder einen Geburtstag vergessen.</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Alle Geburtstage, Hochzeitstage und besonderen Tage deiner Menschen – mit Countdown, Alter und Erinnerung im eigenen Kalender.
          </p>
        </div>

        {error && <div className="notice err">{error}</div>}

        <div className="org-stats">
          <div className="org-stat"><strong>{week}</strong><span>diese Woche</span></div>
          <div className="org-stat"><strong>{month}</strong><span>in 30 Tagen</span></div>
          <div className="org-stat"><strong>{all.length}</strong><span>Termine gesamt</span></div>
          <div className="org-stat next">
            <strong>{next ? whenLabel(next.days) : "–"}</strong>
            <span>{next ? `nächster: ${next.name}` : "noch nichts vorgemerkt"}</span>
          </div>
        </div>

        {(adding || (rows && all.length === 0)) && (
          <QuickAdd
            rows={rows ?? []}
            onDone={(text) => {
              setAdding(false);
              setError("");
              load();
              setToast(text);
            }}
            onError={setError}
          />
        )}

        {toast && <div className="notice ok" role="status">{toast}</div>}

        {all.length > 0 && (
          <div className="spread" style={{ alignItems: "center" }}>
            <div className="seg" role="group" aria-label="Filter">
              {(["alle", "geburtstage", "andere"] as Filter[]).map((f) => (
                <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
                  {f === "alle" ? "Alle" : f === "geburtstage" ? "🎂 Geburtstage" : "💍 Andere Tage"}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Suchen …" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 220 }} />
          </div>
        )}

        {byMonth.map((g) => (
          <section key={g.title} className="stack" style={{ gap: 8 }}>
            <h3 className="org-month">{g.title}</h3>
            {g.items.map((e) => (
              <div key={e.key} className={`org-item${e.days <= 1 ? " urgent" : e.days <= 7 ? " soon" : ""}`}>
                <div className="org-date">
                  <span className="wd">{WEEKDAYS[e.next.getDay()]}</span>
                  <strong>{e.next.getDate()}.</strong>
                  <span className="mo">{MONTHS[e.next.getMonth()].slice(0, 3)}</span>
                </div>
                <div className="org-body">
                  <div>
                    <span aria-hidden="true">{e.emoji}</span> <strong>{e.name}</strong>
                    {e.relation && <span className="muted small"> · {e.relation}</span>}
                  </div>
                  <div className="small">
                    {e.birthday || !e.years ? e.label : null}
                    {yearsLabel(e) && <>{e.birthday ? " · " : ""}<b>{yearsLabel(e)}</b></>}
                    {" · "}
                    <span className={e.days <= 7 ? "org-count hot" : "org-count"}>{whenLabel(e.days)}</span>
                    {e.cardCount > 0 && <span className="tag" style={{ marginLeft: 6 }}>✓ Karte</span>}
                  </div>
                </div>
                <div className="org-actions">
                  <Link href={`/kontakt/?id=${e.contactId}`} className="btn sm">{e.cardCount > 0 ? "Ansehen" : "Karte"}</Link>
                  <button
                    className="btn ghost sm icon"
                    title="In meinen Kalender"
                    aria-label={`${e.label} von ${e.name} in den Kalender übernehmen`}
                    onClick={() => download(`${e.name.replace(/[^\p{L}\p{N}]+/gu, "-")}.ics`, toICS([e], lead))}
                  >
                    📅
                  </button>
                </div>
              </div>
            ))}
          </section>
        ))}

        {all.length > 0 && shown.length === 0 && <div className="notice">Nichts gefunden.</div>}

        {all.length > 0 && (
          <section className="panel stack">
            <h3>📲 In deinen Handy-Kalender</h3>
            <p className="muted small" style={{ margin: 0 }}>
              Lädt alle Termine als Kalender-Datei. Auf dem iPhone oder Android-Handy antippen und „Alle hinzufügen“ wählen – dann
              erinnert dich dein Handy jedes Jahr, auch wenn Funkelpost geschlossen ist.
            </p>
            <div className="row" style={{ alignItems: "flex-end" }}>
              <label className="field" style={{ minWidth: 200 }}>
                <span>Erinnerung</span>
                <select value={lead} onChange={(e) => setLeadSaved(Number(e.target.value))}>
                  <option value={0}>nur am Tag selbst (9 Uhr)</option>
                  <option value={1}>1 Tag vorher + am Tag</option>
                  <option value={3}>3 Tage vorher + am Tag</option>
                  <option value={7}>1 Woche vorher + am Tag</option>
                  <option value={14}>2 Wochen vorher + am Tag</option>
                </select>
              </label>
              <button className="btn" onClick={() => download("funkelpost-geburtstage.ics", toICS(all, lead))}>
                Alle {all.length} Termine in den Kalender
              </button>
            </div>
          </section>
        )}

        {noDate.length > 0 && (
          <div className="notice">
            <strong>Noch ohne Datum:</strong>{" "}
            {noDate.map((c, i) => (
              <span key={c.id}>
                {i > 0 && " · "}
                <Link href={`/kontakt/?id=${c.id}`}>{c.name}</Link>
              </span>
            ))}
            <div className="muted small">Trag ein Datum ein, damit sie hier erscheinen.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickAdd({ rows, onDone, onError }: { rows: ContactRow[]; onDone: (text: string) => void; onError: (t: string) => void }) {
  const [who, setWho] = useState("neu");
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [label, setLabel] = useState("Geburtstag");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!date) return onError("Bitte Tag und Monat wählen.");
    if (!label.trim()) return onError("Bitte angeben, was für ein Tag das ist.");
    setBusy(true);
    try {
      const birthday = label.trim().toLowerCase() === "geburtstag";
      if (who === "neu") {
        if (!name.trim()) return onError("Bitte einen Namen angeben.");
        const input = contactInput({
          name,
          relation,
          address: "du",
          occasion: "geburtstag",
          date: birthday ? date : "",
          events: birthday ? [] : [{ label, date }],
          mood: ["herzlich", "witzig"],
          notes: "",
        });
        if (typeof input === "string") return onError(input);
        await repo.saveContact(null, input);
        onDone(`✓ ${label} von ${input.name} vorgemerkt.`);
      } else {
        const cur = (await repo.getContact(who))?.contact;
        if (!cur) return onError("Diese Person gibt es nicht mehr.");
        // A birthday goes into the main date if that is still free; everything else is an extra date.
        const main = birthday && !cur.date;
        const input = contactInput({
          ...cur,
          occasion: main ? "geburtstag" : cur.occasion,
          date: main ? date : cur.date,
          events: main ? cur.events : [...cur.events, { label, date }],
        });
        if (typeof input === "string") return onError(input);
        await repo.saveContact(cur.id, input);
        onDone(`✓ ${label} von ${cur.name} vorgemerkt.`);
      }
    } catch (e) {
      onError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  const year = Number(date.slice(0, 4));
  return (
    <section className="panel stack">
      <h3>📌 Datum vormerken</h3>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field grow" style={{ minWidth: 180 }}>
          <span>Für wen?</span>
          <select value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="neu">+ Neue Person</option>
            {rows.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.relation ? ` (${c.relation})` : ""}</option>
            ))}
          </select>
        </label>
        {who === "neu" && (
          <>
            <label className="field grow" style={{ minWidth: 160 }}>
              <span>Name</span>
              <input value={name} maxLength={80} placeholder="z. B. Oma Gisela" onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field grow" style={{ minWidth: 140 }}>
              <span>Beziehung (optional)</span>
              <input value={relation} maxLength={60} placeholder="z. B. Oma" onChange={(e) => setRelation(e.target.value)} />
            </label>
          </>
        )}
      </div>
      <div className="chips">
        {DATE_KINDS.map((k) => (
          <button key={k.label} type="button" className={`chip${label === k.label ? " on" : ""}`} onClick={() => setLabel(k.label)}>
            {k.emoji} {k.label}
          </button>
        ))}
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field" style={{ minWidth: 160 }}>
          <span>Oder eigener Name</span>
          <input value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <div className="field">
          <span className="muted small">Datum</span>
          <DayPicker value={date} onChange={setDate} />
        </div>
      </div>
      {year > NO_YEAR && <div className="muted small">Mit Jahr zeigt der Organizer das Alter bzw. die Anzahl der Jahre.</div>}
      <div>
        <button className="btn" onClick={submit} disabled={busy}>{busy ? "Speichert …" : "Vormerken"}</button>
      </div>
    </section>
  );
}

