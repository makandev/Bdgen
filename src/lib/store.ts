import { normalizeBackup, type Backup, type ContactInput } from "./records";
import { newId } from "./id";
import type { Card, Contact, Rating } from "./types";

export { contactInput, type ContactInput } from "./records";

const KEYS = { contacts: "bdgen:v1:contacts", cards: "bdgen:v1:cards", ratings: "bdgen:v1:ratings" };


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

/** Contacts saved before the organizer existed have no `events` yet. */
const withEvents = (c: Contact): Contact => ({ ...c, events: Array.isArray(c.events) ? c.events : [] });

export const contacts = {
  list(): (Contact & { cardCount: number })[] {
    const all = read<Card>(KEYS.cards);
    return read<Contact>(KEYS.contacts)
      .map((c) => ({ ...withEvents(c), cardCount: all.filter((k) => k.contactId === c.id).length }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  },
  get(id: string): Contact | null {
    const c = read<Contact>(KEYS.contacts).find((c) => c.id === id);
    return c ? withEvents(c) : null;
  },
  create(input: ContactInput): Contact {
    const t = now();
    const c: Contact = { ...input, id: newId(), createdAt: t, updatedAt: t };
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
    const card: Card = { ...input, id: newId(), createdAt: t, updatedAt: t };
    write(KEYS.cards, [...read<Card>(KEYS.cards), card]);
    return card;
  },
  update(id: string, patch: Partial<Pick<Card, "title" | "data">>): Card | null {
    const list = read<Card>(KEYS.cards);
    const cur = list.find((k) => k.id === id);
    if (!cur) return null;
    const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const next: Card = { ...cur, ...defined, updatedAt: now() };
    write(KEYS.cards, list.map((k) => (k.id === id ? next : k)));
    return next;
  },
  remove(id: string): void {
    write(KEYS.cards, read<Card>(KEYS.cards).filter((k) => k.id !== id));
  },
};

export function exportBackup(): Backup {
  return { app: "bdgen", version: 1, exportedAt: now(), contacts: read(KEYS.contacts), cards: read(KEYS.cards) };
}

/** Merges a backup into local data (same ids are overwritten). Returns counts. */
export function importBackup(raw: unknown): { contacts: number; cards: number } {
  const n = normalizeBackup(raw);
  const mergeById = <T extends { id: string }>(cur: T[], add: T[]) => [...cur.filter((x) => !add.some((y) => y.id === x.id)), ...add];
  write(KEYS.contacts, mergeById(read<Contact>(KEYS.contacts), n.contacts));
  write(KEYS.cards, mergeById(read<Card>(KEYS.cards), n.cards));
  return { contacts: n.contacts.length, cards: n.cards.length };
}

export const ratings = {
  list(): Rating[] {
    return read<Rating>(KEYS.ratings);
  },
  add(r: Rating): void {
    // Keep the newest 500 – plenty for learning, small in storage.
    write(KEYS.ratings, [...read<Rating>(KEYS.ratings), r].slice(-500));
  },
  clear(): void {
    write(KEYS.ratings, []);
  },
};

/** Asks the browser not to evict our data (helps on iOS). */
export function requestPersistence() {
  navigator.storage?.persist?.().catch(() => {});
}
