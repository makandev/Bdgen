import { PublicError } from "./errors";
import { defaultCardData } from "./templates";
import type { Card, Contact, ExtraDate } from "./types";
import { address, normalizeCardData, occasion, str } from "./validate";

export type ContactInput = Omit<Contact, "id" | "createdAt" | "updatedAt">;

export function contactInput(b: Record<string, unknown>): ContactInput | string {
  const name = str(b.name, "", 80).trim();
  if (!name) return "Bitte einen Namen bzw. eine Anrede angeben.";
  return {
    name,
    relation: str(b.relation, "", 60).trim(),
    address: address(b.address),
    occasion: occasion(b.occasion),
    date: isoDate(b.date) ? String(b.date) : "",
    events: extraDates(b.events),
    mood: Array.isArray(b.mood) ? b.mood.map((m) => str(m, "", 30)).filter(Boolean).slice(0, 16) : [],
    notes: str(b.notes, "", NOTES_MAX),
  };
}

function isoDate(v: unknown): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12 && Number(m[3]) >= 1 && Number(m[3]) <= 31;
}

/** Most extra dates per person – enough for wedding day, name day and a few more. */
export const EVENTS_MAX = 12;

function extraDates(v: unknown): ExtraDate[] {
  if (!Array.isArray(v)) return [];
  const out: ExtraDate[] = [];
  for (const e of v) {
    const label = str(e?.label, "", 40).replace(/\s+/g, " ").trim();
    if (!label || !isoDate(e?.date)) continue;
    out.push({ label, date: String(e.date) });
    if (out.length >= EVENTS_MAX) break;
  }
  return out;
}

/** Longest notes about a person (the textarea uses the same limit, so nothing is cut silently). */
export const NOTES_MAX = 4000;

export interface Backup {
  app: "bdgen";
  version: 1;
  exportedAt: string;
  contacts: Contact[];
  cards: Card[];
}

/** Validates an uploaded backup; anything malformed is dropped. */
export function normalizeBackup(raw: unknown): { contacts: Contact[]; cards: Card[] } {
  const b = raw as Partial<Backup>;
  if (!b || b.app !== "bdgen" || !Array.isArray(b.contacts) || !Array.isArray(b.cards)) {
    throw new PublicError("Das ist keine Funkelpost-Sicherung.");
  }
  const t = new Date().toISOString();
  const contacts: Contact[] = [];
  for (const c of b.contacts) {
    const input = contactInput((c ?? {}) as unknown as Record<string, unknown>);
    if (typeof input === "string" || typeof c?.id !== "string") continue;
    contacts.push({ ...input, id: c.id, createdAt: str(c.createdAt, t), updatedAt: str(c.updatedAt, t) });
  }
  const cards: Card[] = [];
  for (const k of b.cards) {
    if (!k || typeof k.id !== "string" || !k.data) continue;
    const d = k.data as Partial<Card["data"]>;
    const fb = defaultCardData({ recipientName: str(d.recipientName, ""), address: address(d.address), occasion: occasion(d.occasion) });
    cards.push({
      id: k.id,
      contactId: typeof k.contactId === "string" ? k.contactId : null,
      title: str(k.title, "Karte", 120),
      data: normalizeCardData(k.data, fb),
      createdAt: str(k.createdAt, t),
      updatedAt: str(k.updatedAt, t),
    });
  }
  return { contacts, cards };
}
