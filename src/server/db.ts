import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";
import type { Backup, ContactInput } from "@/lib/records";
import type { Card, CardData, Contact, Rating, Reaction } from "@/lib/types";

// Loaded via getBuiltinModule so the bundler never tries to resolve node:sqlite.
const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite");

const g = globalThis as unknown as { __bdgenDb?: DatabaseSyncType };

function db(): DatabaseSyncType {
  if (g.__bdgenDb) return g.__bdgenDb;
  const path = resolve(/*turbopackIgnore: true*/ process.env.DATABASE_PATH || "./data/funkelpost.db");
  mkdirSync(dirname(path), { recursive: true });
  const d = new DatabaseSync(path);
  d.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      relation TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT 'du',
      occasion TEXT NOT NULL DEFAULT 'geburtstag',
      date TEXT NOT NULL DEFAULT '',
      mood TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      title TEXT NOT NULL DEFAULT '',
      shared INTEGER NOT NULL DEFAULT 1,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS cards_contact ON cards(contact_id);
    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL,
      label TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS reactions_card ON reactions(card_id);
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  // Added later: older databases get the column on start.
  const cols = d.prepare("PRAGMA table_info(contacts)").all() as Row[];
  if (!cols.some((c) => c.name === "events")) d.exec("ALTER TABLE contacts ADD COLUMN events TEXT NOT NULL DEFAULT '[]'");
  g.__bdgenDb = d;
  return d;
}

const now = () => new Date().toISOString();

type Row = Record<string, unknown>;

function toContact(r: Row): Contact {
  let mood: string[] = [];
  let events: Contact["events"] = [];
  try {
    mood = JSON.parse(String(r.mood));
  } catch {}
  try {
    events = JSON.parse(String(r.events ?? "[]"));
  } catch {}
  return {
    id: String(r.id),
    name: String(r.name),
    relation: String(r.relation),
    address: r.address === "sie" ? "sie" : "du",
    occasion: String(r.occasion) as Contact["occasion"],
    date: String(r.date),
    events: Array.isArray(events) ? events : [],
    mood: Array.isArray(mood) ? mood : [],
    notes: String(r.notes),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function toCard(r: Row): Card {
  return {
    id: String(r.id),
    slug: String(r.slug),
    contactId: r.contact_id ? String(r.contact_id) : null,
    title: String(r.title),
    shared: Number(r.shared) === 1,
    data: JSON.parse(String(r.data)) as CardData,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export const contacts = {
  list(): (Contact & { cardCount: number })[] {
    const rows = db()
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM cards k WHERE k.contact_id = c.id) AS card_count
         FROM contacts c ORDER BY c.name COLLATE NOCASE`,
      )
      .all() as Row[];
    return rows.map((r) => ({ ...toContact(r), cardCount: Number(r.card_count) }));
  },
  get(id: string): Contact | null {
    const r = db().prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Row | undefined;
    return r ? toContact(r) : null;
  },
  create(input: ContactInput): Contact {
    const id = randomUUID();
    const t = now();
    db()
      .prepare(
        `INSERT INTO contacts (id, name, relation, address, occasion, date, events, mood, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.name, input.relation, input.address, input.occasion, input.date, JSON.stringify(input.events), JSON.stringify(input.mood), input.notes, t, t);
    return this.get(id)!;
  },
  update(id: string, input: ContactInput): Contact | null {
    const cur = this.get(id);
    if (!cur) return null;
    if (cur.name !== input.name) {
      // Cards that still use the old name follow the rename.
      for (const k of cards.list(id)) {
        if (k.data.recipientName === cur.name) cards.update(k.id, { data: { ...k.data, recipientName: input.name } });
      }
    }
    db()
      .prepare(
        `UPDATE contacts SET name = ?, relation = ?, address = ?, occasion = ?, date = ?, events = ?, mood = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(input.name, input.relation, input.address, input.occasion, input.date, JSON.stringify(input.events), JSON.stringify(input.mood), input.notes, now(), id);
    return this.get(id);
  },
  remove(id: string): void {
    db().prepare("DELETE FROM contacts WHERE id = ?").run(id);
  },
};

function newSlug(): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...randomBytes(12)].map((b) => alphabet[b % alphabet.length]).join("");
}

export const cards = {
  list(contactId?: string): Card[] {
    const rows = (contactId
      ? db().prepare("SELECT * FROM cards WHERE contact_id = ? ORDER BY updated_at DESC").all(contactId)
      : db().prepare("SELECT * FROM cards ORDER BY updated_at DESC").all()) as Row[];
    return rows.map(toCard);
  },
  get(id: string): Card | null {
    const r = db().prepare("SELECT * FROM cards WHERE id = ?").get(id) as Row | undefined;
    return r ? toCard(r) : null;
  },
  bySlug(slug: string): Card | null {
    const r = db().prepare("SELECT * FROM cards WHERE slug = ?").get(slug) as Row | undefined;
    return r ? toCard(r) : null;
  },
  create(input: { contactId: string | null; title: string; data: CardData }): Card {
    const id = randomUUID();
    const t = now();
    db()
      .prepare(
        `INSERT INTO cards (id, slug, contact_id, title, shared, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
      )
      .run(id, newSlug(), input.contactId, input.title, JSON.stringify(input.data), t, t);
    return this.get(id)!;
  },
  update(id: string, patch: { title?: string; shared?: boolean; data?: CardData }): Card | null {
    const cur = this.get(id);
    if (!cur) return null;
    db()
      .prepare("UPDATE cards SET title = ?, shared = ?, data = ?, updated_at = ? WHERE id = ?")
      .run(
        patch.title ?? cur.title,
        (patch.shared ?? cur.shared) ? 1 : 0,
        JSON.stringify(patch.data ?? cur.data),
        now(),
        id,
      );
    return this.get(id);
  },
  remove(id: string): void {
    db().prepare("DELETE FROM cards WHERE id = ?").run(id);
  },
};

function toReaction(r: Row): Reaction {
  return {
    id: String(r.id),
    cardId: String(r.card_id),
    emoji: String(r.emoji),
    label: String(r.label),
    message: String(r.message),
    createdAt: String(r.created_at),
  };
}

export const reactions = {
  forCard(cardId: string): Reaction[] {
    return (db().prepare("SELECT * FROM reactions WHERE card_id = ? ORDER BY created_at DESC").all(cardId) as Row[]).map(toReaction);
  },
  recent(limit = 20): (Reaction & { cardTitle: string; contactId: string | null; contactName: string })[] {
    const rows = db()
      .prepare(
        `SELECT r.*, k.title AS card_title, k.contact_id AS contact_id, c.name AS contact_name
         FROM reactions r JOIN cards k ON k.id = r.card_id LEFT JOIN contacts c ON c.id = k.contact_id
         ORDER BY r.created_at DESC LIMIT ?`,
      )
      .all(limit) as Row[];
    return rows.map((r) => ({
      ...toReaction(r),
      cardTitle: String(r.card_title),
      contactId: r.contact_id ? String(r.contact_id) : null,
      contactName: r.contact_name ? String(r.contact_name) : "",
    }));
  },
  count(cardId: string): number {
    return Number((db().prepare("SELECT COUNT(*) AS n FROM reactions WHERE card_id = ?").get(cardId) as Row).n);
  },
  add(cardId: string, emoji: string, label: string): Reaction {
    const id = randomUUID();
    db().prepare("INSERT INTO reactions (id, card_id, emoji, label, message, created_at) VALUES (?, ?, ?, ?, '', ?)").run(id, cardId, emoji, label, now());
    return toReaction(db().prepare("SELECT * FROM reactions WHERE id = ?").get(id) as Row);
  },
  get(id: string): Reaction | null {
    const r = db().prepare("SELECT * FROM reactions WHERE id = ?").get(id) as Row | undefined;
    return r ? toReaction(r) : null;
  },
  setMessage(id: string, message: string): void {
    db().prepare("UPDATE reactions SET message = ? WHERE id = ?").run(message, id);
  },
};

export const ratings = {
  list(): Rating[] {
    return (db().prepare("SELECT data FROM ratings ORDER BY created_at").all() as Row[]).map((r) => JSON.parse(String(r.data)) as Rating);
  },
  add(r: Rating): void {
    db().prepare("INSERT OR REPLACE INTO ratings (id, data, created_at) VALUES (?, ?, ?)").run(r.id, JSON.stringify(r), r.createdAt);
    db().prepare("DELETE FROM ratings WHERE id NOT IN (SELECT id FROM ratings ORDER BY created_at DESC LIMIT 2000)").run();
  },
  clear(): void {
    db().exec("DELETE FROM ratings");
  },
};

export function exportBackup(): Backup {
  return {
    app: "bdgen",
    version: 1,
    exportedAt: now(),
    contacts: contacts.list().map(({ cardCount: _, ...c }) => c),
    cards: cards.list().map(({ slug: _s, shared: _h, ...k }) => k),
  };
}

/** Upserts validated backup rows. Existing share links keep their slug. */
export function importBackup(input: { contacts: Contact[]; cards: Card[] }): void {
  const d = db();
  d.exec("BEGIN");
  try {
    const upC = d.prepare(
      `INSERT INTO contacts (id, name, relation, address, occasion, date, events, mood, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, relation = excluded.relation, address = excluded.address,
         occasion = excluded.occasion, date = excluded.date, events = excluded.events, mood = excluded.mood, notes = excluded.notes, updated_at = excluded.updated_at`,
    );
    for (const c of input.contacts) {
      upC.run(c.id, c.name, c.relation, c.address, c.occasion, c.date, JSON.stringify(c.events), JSON.stringify(c.mood), c.notes, c.createdAt, c.updatedAt);
    }
    const upK = d.prepare(
      `INSERT INTO cards (id, slug, contact_id, title, shared, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET contact_id = excluded.contact_id, title = excluded.title, data = excluded.data, updated_at = excluded.updated_at`,
    );
    const known = new Set(input.contacts.map((c) => c.id));
    for (const k of input.cards) {
      const contactId = k.contactId && (known.has(k.contactId) || contacts.get(k.contactId)) ? k.contactId : null;
      upK.run(k.id, newSlug(), contactId, k.title, JSON.stringify(k.data), k.createdAt, k.updatedAt);
    }
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

/** Current login generation; raising it logs out every device. */
export const sessions = {
  generation(): number {
    const r = db().prepare("SELECT value FROM meta WHERE key = 'session_generation'").get() as Row | undefined;
    return r ? Number(r.value) || 0 : 0;
  },
  logoutEverywhere(): number {
    const next = this.generation() + 1;
    db().prepare("INSERT INTO meta (key, value) VALUES ('session_generation', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(String(next));
    return next;
  },
};
