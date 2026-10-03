import { defaultCardData } from "./templates";
import type { Card, Contact } from "./types";
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
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : "",
    mood: Array.isArray(b.mood) ? b.mood.map((m) => str(m, "", 30)).filter(Boolean).slice(0, 8) : [],
    notes: str(b.notes, "", 4000),
  };
}

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
    throw new Error("Das ist keine Funkelpost-Sicherung.");
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
