"use client";

import { DATE_KINDS, emojiFor, NO_YEAR, parts } from "@/lib/organizer";
import type { ExtraDate } from "@/lib/types";

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Day + month + optional year. An empty year is stored as NO_YEAR ("year unknown"). */
export function DayPicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const p = parts(value);
  const day = p?.day ?? 0;
  const month = p?.month ?? 0;
  const year = p?.year ?? null;
  const emit = (d: number, m: number, y: number | null) => {
    if (!d || !m) return onChange("");
    const max = new Date(2004, m, 0).getDate(); // 2004: leap year, so 29 Feb stays possible
    onChange(`${y && y > NO_YEAR ? y : NO_YEAR}-${pad(m)}-${pad(Math.min(d, max))}`);
  };
  return (
    <div className="day-picker">
      <select aria-label="Tag" value={day || ""} onChange={(e) => emit(Number(e.target.value), month || 1, year)}>
        <option value="">Tag</option>
        {Array.from({ length: 31 }, (_, i) => (
          <option key={i} value={i + 1}>{i + 1}.</option>
        ))}
      </select>
      <select aria-label="Monat" value={month || ""} onChange={(e) => emit(day || 1, Number(e.target.value), year)}>
        <option value="">Monat</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>
      <input
        aria-label="Jahr (optional)"
        inputMode="numeric"
        placeholder="Jahr (optional)"
        value={year ?? ""}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
          emit(day, month, v.length === 4 ? Number(v) : null);
        }}
      />
    </div>
  );
}

/** Further dates of a person: wedding day, name day … */
export function ExtraDates({ value, onChange }: { value: ExtraDate[]; onChange: (v: ExtraDate[]) => void }) {
  const put = (i: number, patch: Partial<ExtraDate>) => onChange(value.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  return (
    <div className="stack" style={{ gap: 8 }}>
      <datalist id="date-kinds">
        {DATE_KINDS.map((k) => (
          <option key={k.label} value={k.label} />
        ))}
      </datalist>
      {value.map((e, i) => (
        <div key={i} className="extra-date">
          <span className="extra-emoji" aria-hidden="true">{emojiFor(e.label)}</span>
          <input list="date-kinds" aria-label="Was ist das für ein Tag?" placeholder="z. B. Hochzeitstag" value={e.label} maxLength={40} onChange={(ev) => put(i, { label: ev.target.value })} />
          <DayPicker value={e.date} onChange={(date) => put(i, { date })} />
          <button type="button" className="btn ghost sm icon" aria-label="Termin entfernen" title="Termin entfernen" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      {value.length < 12 && (
        <div>
          <button type="button" className="btn ghost sm" onClick={() => onChange([...value, { label: value.length ? "" : "Hochzeitstag", date: "" }])}>
            + Weiteren Termin vormerken
          </button>
          <span className="muted small"> z. B. Hochzeitstag oder Namenstag – erscheint im 📅 Organizer.</span>
        </div>
      )}
    </div>
  );
}
