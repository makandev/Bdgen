import { defaultCardData } from "./templates";
import type { Card, Contact } from "./types";
import { address, normalizeCardData, occasion, str } from "./validate";

const KEYS = { contacts: "bdgen:v1:contacts", cards: "bdgen:v1:cards" };

export type ContactInput = Omit<Contact, "id" | "createdAt" | "updatedAt">;

const now = () => new Date().toISOString();

function read<T>(key: string): T[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Der Speicher dieses Browsers ist voll. Bitte alte Karten löschen oder eine Sicherung herunterladen.");
  }
}

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

export const contacts = {
  list(): (Contact & { cardCount: number })[] {
    const all = read<Card>(KEYS.cards);
    return read<Contact>(KEYS.contacts)
      .map((c) => ({ ...c, cardCount: all.filter((k) => k.contactId === c.id).length }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  },
  get(id: string): Contact | null {
    return read<Contact>(KEYS.contacts).find((c) => c.id === id) ?? null;
  },
  create(input: ContactInput): Contact {
    const t = now();
    const c: Contact = { ...input, id: crypto.randomUUID(), createdAt: t, updatedAt: t };
    write(KEYS.contacts, [...read<Contact>(KEYS.contacts), c]);
    return c;
  },
  update(id: string, input: ContactInput): Contact | null {
    const list = read<Contact>(KEYS.contacts);
    const cur = list.find((c) => c.id === id);
    if (!cur) return null;
    const next: Contact = { ...cur, ...input, updatedAt: now() };
    write(KEYS.contacts, list.map((c) => (c.id === id ? next : c)));
    // Cards that still use the old name follow the rename.
    if (cur.name !== next.name) {
      const all = read<Card>(KEYS.cards);
      write(
        KEYS.cards,
        all.map((k) =>
          k.contactId === id && k.data.recipientName === cur.name ? { ...k, data: { ...k.data, recipientName: next.name } } : k,
        ),
      );
    }
    return next;
  },
  remove(id: string): void {
    write(KEYS.contacts, read<Contact>(KEYS.contacts).filter((c) => c.id !== id));
    write(KEYS.cards, read<Card>(KEYS.cards).filter((k) => k.contactId !== id));
  },
};

export const cards = {
  list(contactId?: string): Card[] {
    return read<Card>(KEYS.cards)
      .filter((k) => !contactId || k.contactId === contactId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  get(id: string): Card | null {
    return read<Card>(KEYS.cards).find((k) => k.id === id) ?? null;
  },
  create(input: Pick<Card, "contactId" | "title" | "data">): Card {
    const t = now();
    const card: Card = { ...input, id: crypto.randomUUID(), createdAt: t, updatedAt: t };
    write(KEYS.cards, [...read<Card>(KEYS.cards), card]);
    return card;
  },
  update(id: string, patch: Partial<Pick<Card, "title" | "data">>): Card | null {
    const list = read<Card>(KEYS.cards);
    const cur = list.find((k) => k.id === id);
    if (!cur) return null;
    const next: Card = { ...cur, ...patch, updatedAt: now() };
    write(KEYS.cards, list.map((k) => (k.id === id ? next : k)));
    return next;
  },
  remove(id: string): void {
    write(KEYS.cards, read<Card>(KEYS.cards).filter((k) => k.id !== id));
  },
};

export interface Backup {
  app: "bdgen";
  version: 1;
  exportedAt: string;
  contacts: Contact[];
  cards: Card[];
}

export function exportBackup(): Backup {
  return { app: "bdgen", version: 1, exportedAt: now(), contacts: read(KEYS.contacts), cards: read(KEYS.cards) };
}

/** Merges a backup into local data (same ids are overwritten). Returns counts. */
export function importBackup(raw: unknown): { contacts: number; cards: number } {
  const b = raw as Partial<Backup>;
  if (!b || b.app !== "bdgen" || !Array.isArray(b.contacts) || !Array.isArray(b.cards)) {
    throw new Error("Das ist keine Bdgen-Sicherung.");
  }
  const t = now();
  const inContacts: Contact[] = [];
  for (const c of b.contacts) {
    const input = contactInput((c ?? {}) as unknown as Record<string, unknown>);
    if (typeof input === "string" || typeof c?.id !== "string") continue;
    inContacts.push({ ...input, id: c.id, createdAt: str(c.createdAt, t), updatedAt: str(c.updatedAt, t) });
  }
  const inCards: Card[] = [];
  for (const k of b.cards) {
    if (!k || typeof k.id !== "string" || !k.data) continue;
    const d = k.data as Partial<Card["data"]>;
    const fb = defaultCardData({ recipientName: str(d.recipientName, ""), address: address(d.address), occasion: occasion(d.occasion) });
    inCards.push({
      id: k.id,
      contactId: typeof k.contactId === "string" ? k.contactId : null,
      title: str(k.title, "Karte", 120),
      data: normalizeCardData(k.data, fb),
      createdAt: str(k.createdAt, t),
      updatedAt: str(k.updatedAt, t),
    });
  }
  const mergeById = <T extends { id: string }>(cur: T[], add: T[]) => [...cur.filter((x) => !add.some((y) => y.id === x.id)), ...add];
  write(KEYS.contacts, mergeById(read<Contact>(KEYS.contacts), inContacts));
  write(KEYS.cards, mergeById(read<Card>(KEYS.cards), inCards));
  return { contacts: inContacts.length, cards: inCards.length };
}

/** Asks the browser not to evict our data (helps on iOS). */
export function requestPersistence() {
  navigator.storage?.persist?.().catch(() => {});
}
