"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { errText } from "@/components/client";
import { dateLabel, daysUntil } from "@/components/dates";
import { Sparkles } from "@/components/Sparkles";
import { Thumb } from "@/components/Thumb";
import { TopBar } from "@/components/TopBar";
import { EXAMPLES } from "@/lib/examples";
import { OCCASIONS, relationEmoji } from "@/lib/presets";
import { repo, SERVER } from "@/lib/repo";
import type { Reaction } from "@/lib/types";
import type { Contact } from "@/lib/types";

type Row = Contact & { cardCount: number };

/** A varied handful for the start page – different designs, people and occasions. */
const INSPIRE = ["oma", "enkel", "silvester", "bruder", "schwester", "kollegin"]
  .map((id) => EXAMPLES.find((e) => e.id === id))
  .filter((e): e is (typeof EXAMPLES)[number] => !!e);

export default function Home() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [ai, setAi] = useState<string | null>(null);
  const [reacts, setReacts] = useState<(Reaction & { cardTitle: string; contactId: string | null; contactName: string })[]>([]);

  useEffect(() => {
    repo.listContacts().then(setRows).catch((e) => setError(errText(e)));
    repo.aiSource().then(setAi).catch(() => {});
    if (SERVER) repo.recentReactions().then(setReacts).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (rows ?? []).filter((r) => !s || `${r.name} ${r.relation}`.toLowerCase().includes(s));
    return list.sort((a, b) => (daysUntil(a.date) ?? 999) - (daysUntil(b.date) ?? 999) || a.name.localeCompare(b.name));
  }, [rows, q]);

  const soon = filtered.filter((r) => (daysUntil(r.date) ?? 999) <= 14);

  return (
    <>
    <Sparkles />
    <div className="shell over-sparkles">
      <TopBar>
        <Link href="/kontakt/?id=neu" className="btn sm">+ Neue Person</Link>
      </TopBar>

      <div className="stack">
        <Link href="/schnell/" className="quick-cta">
          <span className="qi" aria-hidden="true">⚡</span>
          <span>
            <strong>Schnell-Karte in 1 Minute</strong>
            <span className="muted small"> – sag, für wen, beantworte ein, zwei Fragen, den Rest zaubert die KI.</span>
          </span>
          <span className="btn sm">Los →</span>
        </Link>
        {reacts.length > 0 && (
          <div className="panel stack" style={{ gap: 8 }}>
            <h3>💌 Neue Reaktionen</h3>
            <div className="reaction-list">
              {reacts.slice(0, 4).map((r) => (
                <Link key={r.id} href={`/karte/?id=${r.cardId}`} className="reaction-item" style={{ textDecoration: "none", color: "inherit" }}>
                  <span className="em">{r.emoji}</span>
                  <div>
                    <strong>{r.contactName || r.cardTitle}</strong>: {r.label}
                    {r.message && <div className="small">„{r.message}“</div>}
                    <div className="muted small">{new Date(r.createdAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="spread">
          <div>
            <div className="eyebrow">Deine Menschen</div>
            <h1>Für wen soll es heute etwas sein?</h1>
          </div>
          {rows && rows.length > 4 && (
            <input type="text" placeholder="Suchen …" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 240 }} />
          )}
        </div>

        {ai === "none" && (
          <div className="notice">
            {SERVER ? (
              <>Auf dem Server ist noch keine KI eingerichtet (GEMINI_API_KEY oder OPENROUTER_API_KEY in der .env) – Karten entstehen dann aus einer Vorlage.</>
            ) : (
              <>
                Die KI ist auf diesem Gerät noch nicht eingerichtet – Karten entstehen dann aus einer Vorlage.{" "}
                <Link href="/einstellungen/">KI einrichten →</Link>
              </>
            )}
          </div>
        )}
        {error && <div className="notice err">{error}</div>}

        {soon.filter((r) => (daysUntil(r.date) ?? 99) <= 7).map((r) => {
          const d = daysUntil(r.date) ?? 0;
          const when = d === 0 ? "heute" : d === 1 ? "morgen" : `in ${d} Tagen`;
          const occ = OCCASIONS.find((o) => o.id === r.occasion);
          return (
            <Link key={r.id} href={`/kontakt/?id=${r.id}`} className={`reminder${d <= 1 ? " urgent" : ""}`}>
              <span className="reminder-emoji" aria-hidden="true">{occ?.emoji ?? "🔔"}</span>
              <span className="reminder-text">
                <strong>{r.occasion === "geburtstag" ? `${r.name} hat ${when} Geburtstag!` : `${occ?.label ?? "Anlass"} für ${r.name} – ${when}!`}</strong>
                <span className="muted small">{r.cardCount > 0 ? "Eine Karte gibt es schon – noch einmal ansehen oder eine neue zaubern." : "Noch keine Karte – jetzt in einer Minute eine Überraschung zaubern."}</span>
              </span>
              <span className="btn sm">{r.cardCount > 0 ? "Ansehen →" : "Karte erstellen →"}</span>
            </Link>
          );
        })}
        {soon.some((r) => (daysUntil(r.date) ?? 0) > 7) && (
          <div className="notice ok">
            <strong>Demnächst:</strong>{" "}
            {soon.filter((r) => (daysUntil(r.date) ?? 0) > 7).map((r, i) => (
              <span key={r.id}>
                {i > 0 && " · "}
                <Link href={`/kontakt/?id=${r.id}`}>{r.name}</Link> ({dateLabel(r.date)})
              </span>
            ))}
          </div>
        )}

        {rows && rows.length === 0 && (
          <div className="panel empty stack">
            <div className="big twinkle-row" aria-hidden="true"><span>✦</span> <span>✧</span> <span>✦</span></div>
            <h2>Noch niemand da.</h2>
            <p className="muted" style={{ margin: 0 }}>
              Leg die erste Person an – mit ein paar Stichworten, Erinnerungen oder Gefühlen. Den Rest schreibt die KI.
            </p>
            <div>
              <Link href="/kontakt/?id=neu" className="btn">Erste Person anlegen →</Link>{" "}
              <Link href="/beispiele/" className="btn ghost">👀 Beispiele ansehen</Link>
            </div>
          </div>
        )}

        {rows && rows.length < 3 && (
          <section className="inspire">
            <div className="spread">
              <h2>So kann es aussehen</h2>
              <Link href="/beispiele/" className="small">Alle {EXAMPLES.length} Beispiele →</Link>
            </div>
            <div className="inspire-row">
              {INSPIRE.map((e) => (
                <Link key={e.id} href={`/beispiele/?zeige=${e.id}`}>
                  <Thumb e={e} />
                  <span>{e.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="contact-grid">
          {filtered.map((r) => {
            const occ = OCCASIONS.find((o) => o.id === r.occasion);
            return (
              <Link key={r.id} href={`/kontakt/?id=${r.id}`} className="panel contact-card">
                <div className="row" style={{ flexWrap: "nowrap" }}>
                  <div className="avatar emoji" aria-hidden="true">{relationEmoji(r.relation)}</div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</h3>
                    <div className="muted small">
                      {r.relation || "Kontakt"} · {r.address === "sie" ? "Sie" : "du"}
                    </div>
                  </div>
                </div>
                <div className="row small">
                  <span className="tag">
                    {occ?.emoji} {occ?.label}
                  </span>
                  {r.date && <span className="muted">{dateLabel(r.date)}</span>}
                </div>
                <div className="muted small">
                  {r.cardCount === 0 ? "Noch keine Karte" : r.cardCount === 1 ? "1 Karte" : `${r.cardCount} Karten`}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}
