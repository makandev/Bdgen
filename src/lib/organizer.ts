import { OCCASIONS } from "./presets";
import type { Contact } from "./types";

/** Years up to this one mean "year unknown" (1904 is a leap year, so 29 February can be stored). */
export const NO_YEAR = 1904;

/** Labels offered when a date is noted down; any other text is allowed too. */
export const DATE_KINDS: { label: string; emoji: string }[] = [
  { label: "Geburtstag", emoji: "🎂" },
  { label: "Hochzeitstag", emoji: "💍" },
  { label: "Jahrestag", emoji: "❤️" },
  { label: "Namenstag", emoji: "😇" },
  { label: "Taufe", emoji: "🕊️" },
  { label: "Einschulung", emoji: "🎒" },
  { label: "Firmenjubiläum", emoji: "🏢" },
  { label: "Gedenktag", emoji: "🕯️" },
];

export interface Entry {
  /** Stable per date, also used as calendar UID. */
  key: string;
  contactId: string;
  name: string;
  relation: string;
  label: string;
  emoji: string;
  birthday: boolean;
  date: string;
  /** Days until the next occurrence (0 = today). */
  days: number;
  /** The next occurrence, local midnight. */
  next: Date;
  /** Age or number of years at the next occurrence, null when the year is unknown. */
  years: number | null;
  cardCount: number;
}

type Row = Contact & { cardCount?: number };

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parts(iso: string): { year: number | null; month: number; day: number } | null {
  const m = ISO.exec(iso);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const year = Number(m[1]);
  return { year: year > NO_YEAR ? year : null, month, day };
}

/** Next occurrence on or after `today` (29 Feb falls on 1 March in other years). */
export function nextOccurrence(iso: string, today = new Date()): Date | null {
  const p = parts(iso);
  if (!p) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(start.getFullYear(), p.month - 1, p.day);
  if (next < start) next = new Date(start.getFullYear() + 1, p.month - 1, p.day);
  return next;
}

export function emojiFor(label: string): string {
  const l = label.toLowerCase();
  return DATE_KINDS.find((k) => k.label.toLowerCase() === l)?.emoji ?? OCCASIONS.find((o) => o.label.toLowerCase() === l)?.emoji ?? "📌";
}

/** All dates of all people, soonest first. */
export function entries(rows: Row[], today = new Date()): Entry[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const out: Entry[] = [];
  const add = (c: Row, key: string, label: string, emoji: string, date: string) => {
    const next = nextOccurrence(date, start);
    const p = parts(date);
    if (!next || !p) return;
    const years = p.year !== null ? next.getFullYear() - p.year : null;
    out.push({
      key,
      contactId: c.id,
      name: c.name,
      relation: c.relation,
      label,
      emoji,
      birthday: label === "Geburtstag",
      date,
      days: Math.round((next.getTime() - start.getTime()) / 864e5),
      next,
      years: years !== null && years >= 0 && years < 130 ? years : null,
      cardCount: c.cardCount ?? 0,
    });
  };
  for (const c of rows) {
    if (c.date) {
      const occ = OCCASIONS.find((o) => o.id === c.occasion);
      add(c, `${c.id}-main`, occ?.label ?? "Anlass", occ?.emoji ?? "🔔", c.date);
    }
    (c.events ?? []).forEach((e, i) => add(c, `${c.id}-${i}`, e.label, emojiFor(e.label), e.date));
  }
  return out.sort((a, b) => a.days - b.days || a.name.localeCompare(b.name, "de"));
}

/** "wird 70", "10. Hochzeitstag", "" when the year is unknown. */
export function yearsLabel(e: Entry): string {
  if (!e.years) return "";
  if (e.birthday) return `wird ${e.years}`;
  return `${e.years}. ${e.label}`;
}

export function whenLabel(days: number): string {
  if (days === 0) return "heute";
  if (days === 1) return "morgen";
  if (days < 7) return `in ${days} Tagen`;
  if (days < 14) return "in 1 Woche";
  if (days < 60) return `in ${Math.floor(days / 7)} Wochen`;
  return `in ${Math.round(days / 30.4)} Monaten`;
}

/** One sentence for a reminder, e.g. "Oma hat morgen Geburtstag!". */
export function reminderText(e: Entry): string {
  const when = whenLabel(e.days);
  const y = e.years ? (e.birthday ? ` (wird ${e.years})` : ` (${e.years}.)`) : "";
  return e.birthday ? `${e.name} hat ${when} Geburtstag${y}!` : `${e.label} von ${e.name} – ${when}${y}!`;
}

// --- Calendar export (iCalendar, RFC 5545) -------------------------------------------------

/** Escapes a TEXT value; line breaks and control characters can never start a new property. */
export function icsText(s: string): string {
  return s
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** Folds a line to at most 75 bytes (UTF-8), never splitting a character. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of Array.from(line)) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + b > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

/**
 * A calendar file with one yearly all-day event per date. Each event reminds on the day at 9:00
 * and, if `leadDays` > 0, also `leadDays` days earlier at 9:00.
 */
export function toICS(list: Entry[], leadDays = 3, now = new Date()): string {
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Funkelpost//Geburtstags-Organizer//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Funkelpost Geburtstage"];
  const alarm = (trigger: string, text: string) => ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(text)}`, `TRIGGER:${trigger}`, "END:VALARM"];
  for (const e of list) {
    const p = parts(e.date);
    if (!p) continue;
    const start = e.next;
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const leap = p.month === 2 && p.day === 29;
    const summary = e.birthday ? `${e.emoji} Geburtstag: ${e.name}` : `${e.emoji} ${e.label}: ${e.name}`;
    const desc = [e.relation, p.year !== null ? (e.birthday ? `geboren ${p.year}` : `seit ${p.year}`) : "", "Karte erstellen in Funkelpost"].filter(Boolean).join(" · ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsText(e.key)}@funkelpost`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(start)}`,
      `DTEND;VALUE=DATE:${ymd(end)}`,
      leap ? "RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1" : "RRULE:FREQ=YEARLY",
      `SUMMARY:${icsText(summary)}`,
      `DESCRIPTION:${icsText(desc)}`,
      "TRANSP:TRANSPARENT",
      ...alarm("PT9H", summary),
      ...(leadDays > 0 ? alarm(`-PT${leadDays * 24 - 9}H`, `In ${leadDays === 1 ? "einem Tag" : `${leadDays} Tagen`}: ${summary}`) : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
