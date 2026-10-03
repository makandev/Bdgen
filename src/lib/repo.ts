import { aiEnabled } from "./ai";
import { BASE } from "./base";
import { startData, type CreateOpts } from "./cardbase";
import { generateCard, restyle, restyleOffline, rewriteScene, testAI, type Brief } from "./prompts";
import type { Backup, ContactInput } from "./records";
import { getAI } from "./settings";
import { encodeCard } from "./share";
import * as local from "./store";
import type { Card, CardData, Cinema, Contact, Effects, Scene, Theme } from "./types";

export const SERVER = process.env.NEXT_PUBLIC_MODE === "server";

export type ContactRow = Contact & { cardCount: number };
export type AISource = "server" | "vault" | "manual" | "none";

/** Everything the UI needs from storage and AI. Two implementations: browser-only and server. */
export interface Repo {
  listContacts(): Promise<ContactRow[]>;
  getContact(id: string): Promise<{ contact: Contact; cards: Card[] } | null>;
  saveContact(id: string | null, input: ContactInput): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  getCard(id: string): Promise<{ card: Card; contact: Contact | null } | null>;
  createCard(contactId: string, opts: CreateOpts): Promise<{ card: Card; warning?: string }>;
  saveCard(id: string, patch: { title?: string; data?: CardData; shared?: boolean }): Promise<Card>;
  deleteCard(id: string): Promise<void>;
  shareLink(card: Card, data: CardData): Promise<string>;
  generate(card: Card, extra: string): Promise<{ scenes: Scene[]; cinema: Cinema; topLine: string }>;
  rewrite(card: Card, scene: Scene, instruction: string): Promise<{ scene: Scene }>;
  restyle(card: Card, data: CardData, instruction: string): Promise<{ theme: Theme; effects: Effects; summary: string }>;
  aiSource(): Promise<AISource>;
  testAI(): Promise<string>;
  exportBackup(): Promise<Backup>;
  importBackup(raw: unknown): Promise<{ contacts: number; cards: number }>;
}

function briefFor(card: Card): Brief {
  const c = card.contactId ? local.contacts.get(card.contactId) : null;
  return {
    relation: c?.relation ?? "",
    address: card.data.address,
    occasion: card.data.occasion,
    mood: c?.mood ?? [],
    notes: c?.notes ?? "",
  };
}

const browserRepo: Repo = {
  async listContacts() {
    return local.contacts.list();
  },
  async getContact(id) {
    const contact = local.contacts.get(id);
    return contact ? { contact, cards: local.cards.list(id) } : null;
  },
  async saveContact(id, input) {
    const c = id ? local.contacts.update(id, input) : local.contacts.create(input);
    if (!c) throw new Error("Diese Person gibt es nicht mehr.");
    return c;
  },
  async deleteContact(id) {
    local.contacts.remove(id);
  },
  async getCard(id) {
    const card = local.cards.get(id);
    if (!card) return null;
    return { card, contact: card.contactId ? local.contacts.get(card.contactId) : null };
  },
  async createCard(contactId, opts) {
    const contact = local.contacts.get(contactId);
    if (!contact) throw new Error("Diese Person gibt es nicht mehr.");
    const { data, title, aiExtra } = startData(contact, opts);
    let card = local.cards.create({ contactId, title, data });
    if (opts.mode !== "ai") return { card };
    if (!aiEnabled()) return { card, warning: "Keine KI eingerichtet – die Karte wurde aus der Vorlage erstellt." };
    try {
      const gen = await generateCard(briefFor(card), aiExtra);
      card = local.cards.update(card.id, { data: { ...data, scenes: gen.scenes, cinema: gen.cinema, topLine: gen.topLine } })!;
      return { card };
    } catch (e) {
      return { card, warning: `Die KI war nicht erreichbar, deshalb wurde die Karte aus der Vorlage erstellt. ${e instanceof Error ? e.message : ""}` };
    }
  },
  async saveCard(id, patch) {
    const card = local.cards.update(id, { title: patch.title, data: patch.data });
    if (!card) throw new Error("Diese Karte gibt es nicht mehr.");
    return card;
  },
  async deleteCard(id) {
    local.cards.remove(id);
  },
  async shareLink(_card, data) {
    return `${window.location.origin}${BASE}/k/#${await encodeCard(data)}`;
  },
  generate: (card, extra) => generateCard(briefFor(card), extra),
  rewrite: (card, scene, instruction) => rewriteScene(briefFor(card), scene, instruction),
  async restyle(_card, data, instruction) {
    return aiEnabled() ? restyle(data.theme, data.effects, instruction) : restyleOffline(data, instruction);
  },
  async aiSource() {
    return aiEnabled() ? (getAI()?.source ?? "none") : "none";
  },
  testAI: () => testAI(),
  async exportBackup() {
    return local.exportBackup();
  },
  async importBackup(raw) {
    return local.importBackup(raw);
  },
};

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${BASE}/api/${path}`, {
    method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
    headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401) {
    window.location.href = `${BASE}/login/?next=${encodeURIComponent(window.location.pathname.slice(BASE.length) + window.location.search)}`;
    throw new Error("Bitte erneut anmelden.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Fehler ${res.status}`);
  return data as T;
}

const serverRepo: Repo = {
  async listContacts() {
    return (await call<{ contacts: ContactRow[] }>("contacts/")).contacts;
  },
  async getContact(id) {
    try {
      return await call<{ contact: Contact; cards: Card[] }>(`contacts/${encodeURIComponent(id)}/`);
    } catch {
      return null;
    }
  },
  async saveContact(id, input) {
    const r = await call<{ contact: Contact }>(id ? `contacts/${encodeURIComponent(id)}/` : "contacts/", { method: id ? "PUT" : "POST", body: input });
    return r.contact;
  },
  async deleteContact(id) {
    await call(`contacts/${encodeURIComponent(id)}/`, { method: "DELETE" });
  },
  async getCard(id) {
    try {
      return await call<{ card: Card; contact: Contact | null }>(`cards/${encodeURIComponent(id)}/`);
    } catch {
      return null;
    }
  },
  createCard: (contactId, opts) => call("cards/", { body: { contactId, ...opts } }),
  async saveCard(id, patch) {
    return (await call<{ card: Card }>(`cards/${encodeURIComponent(id)}/`, { method: "PUT", body: patch })).card;
  },
  async deleteCard(id) {
    await call(`cards/${encodeURIComponent(id)}/`, { method: "DELETE" });
  },
  async shareLink(card) {
    return `${window.location.origin}${BASE}/k/${card.slug}/`;
  },
  generate: (card, extra) => call(`cards/${encodeURIComponent(card.id)}/generate/`, { body: { extra } }),
  rewrite: (card, scene, instruction) => call("ai/scene/", { body: { cardId: card.id, scene, instruction } }),
  restyle: (card, data, instruction) => call("ai/style/", { body: { cardId: card.id, instruction, theme: data.theme, effects: data.effects } }),
  async aiSource() {
    const r = await call<{ providers: string[] }>("status/");
    return r.providers.length ? "server" : "none";
  },
  async testAI() {
    return (await call<{ message: string }>("ai/test/", { body: {} })).message;
  },
  exportBackup: () => call("backup/"),
  importBackup: (raw) => call("backup/", { body: raw }),
};

export const repo: Repo = SERVER ? serverRepo : browserRepo;
