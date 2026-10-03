"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { errText } from "@/components/client";
import { dateLabel, daysUntil } from "@/components/dates";
import { TopBar } from "@/components/TopBar";
import { OCCASIONS, relationEmoji } from "@/lib/presets";
import { repo, SERVER } from "@/lib/repo";
import type { Contact } from "@/lib/types";

type Row = Contact & { cardCount: number };

export default function Home() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [ai, setAi] = useState<string | null>(null);

  useEffect(() => {
    repo.listContacts().then(setRows).catch((e) => setError(errText(e)));
    repo.aiSource().then(setAi).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (rows ?? []).filter((r) => !s || `${r.name} ${r.relation}`.toLowerCase().includes(s));
    return list.sort((a, b) => (daysUntil(a.date) ?? 999) - (daysUntil(b.date) ?? 999) || a.name.localeCompare(b.name));
  }, [rows, q]);

  const soon = filtered.filter((r) => (daysUntil(r.date) ?? 999) <= 14);

  return (
    <div className="shell">
      <TopBar>
        <Link href="/kontakt/?id=neu" className="btn sm">+ Neue Person</Link>
      </TopBar>

      <div className="stack">
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

        {soon.length > 0 && (
          <div className="notice ok">
            <strong>Demnächst:</strong>{" "}
            {soon.map((r, i) => (
              <span key={r.id}>
                {i > 0 && " · "}
                <Link href={`/kontakt/?id=${r.id}`}>{r.name}</Link> ({dateLabel(r.date)})
              </span>
            ))}
          </div>
        )}

        {rows && rows.length === 0 && (
          <div className="panel empty stack">
            <div className="big">✦ ✧ ✦</div>
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
  );
}
