import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";
import type { Backup, ContactInput } from "@/lib/records";
import type { Card, CardData, Contact } from "@/lib/types";

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
  `);
  g.__bdgenDb = d;
  return d;
}

const now = () => new Date().toISOString();

type Row = Record<string, unknown>;

function toContact(r: Row): Contact {
  let mood: string[] = [];
  try {
    mood = JSON.parse(String(r.mood));
  } catch {}
  return {
    id: String(r.id),
    name: String(r.name),
    relation: String(r.relation),
    address: r.address === "sie" ? "sie" : "du",
    occasion: String(r.occasion) as Contact["occasion"],
    date: String(r.date),
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
        `INSERT INTO contacts (id, name, relation, address, occasion, date, mood, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.name, input.relation, input.address, input.occasion, input.date, JSON.stringify(input.mood), input.notes, t, t);
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
        `UPDATE contacts SET name = ?, relation = ?, address = ?, occasion = ?, date = ?, mood = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(input.name, input.relation, input.address, input.occasion, input.date, JSON.stringify(input.mood), input.notes, now(), id);
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
      `INSERT INTO contacts (id, name, relation, address, occasion, date, mood, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, relation = excluded.relation, address = excluded.address,
         occasion = excluded.occasion, date = excluded.date, mood = excluded.mood, notes = excluded.notes, updated_at = excluded.updated_at`,
    );
    for (const c of input.contacts) {
      upC.run(c.id, c.name, c.relation, c.address, c.occasion, c.date, JSON.stringify(c.mood), c.notes, c.createdAt, c.updatedAt);
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
