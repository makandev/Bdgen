import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeCard, encodeCard } from "../src/lib/share";
import { defaultCardData } from "../src/lib/templates";
import { openVault, sealVault } from "../src/lib/vault";

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};

test("share links round-trip and stay short enough for messengers", async () => {
  const d = defaultCardData({ recipientName: "Oma Gisela", address: "du", occasion: "geburtstag", preset: "rose" });
  const s = await encodeCard(d);
  assert.ok(s.length < 4500, `link payload is ${s.length} chars`);
  assert.deepEqual(await decodeCard(s), d);
});

test("tampered share links are rejected or sanitized", async () => {
  assert.equal(await decodeCard("1not-valid"), null);
  assert.equal(await decodeCard("x"), null);
  const evil = { recipientName: "<img src=x onerror=alert(1)>", theme: { bg: "red;}</style><script>alert(1)</script>" } };
  const raw = Buffer.from(JSON.stringify(evil)).toString("base64url");
  const d = await decodeCard("0" + raw);
  assert.ok(d);
  assert.match(d!.theme.bg, /^#[0-9a-f]{6}$/);
});

test("vault opens only with the right password", async () => {
  const v = await sealVault({ gemini: "AIza-test" }, "richtig-langes-passwort");
  assert.ok(!JSON.stringify(v).includes("AIza-test"));
  assert.deepEqual(await openVault(v, "richtig-langes-passwort"), { gemini: "AIza-test" });
  await assert.rejects(openVault(v, "falsch"), /Falsches Passwort/);
});

test("store: renaming a contact renames its cards, deleting removes them", async () => {
  const { contacts, cards, exportBackup, importBackup } = await import("../src/lib/store");
  const c = contacts.create({ name: "Lena", relation: "Schwester", address: "du", occasion: "geburtstag", date: "", events: [], mood: [], notes: "" });
  const k = cards.create({ contactId: c.id, title: "T", data: defaultCardData({ recipientName: "Lena", address: "du", occasion: "geburtstag" }) });
  contacts.update(c.id, { ...c, name: "Lenchen" });
  assert.equal(cards.get(k.id)!.data.recipientName, "Lenchen");
  const backup = exportBackup();
  contacts.remove(c.id);
  assert.equal(cards.list().length, 0);
  assert.deepEqual(importBackup(JSON.parse(JSON.stringify(backup))), { contacts: 1, cards: 1 });
  assert.equal(cards.get(k.id)!.data.recipientName, "Lenchen");
  assert.throws(() => importBackup({ foo: 1 }), /keine Funkelpost-Sicherung/);
});

test("store: saving only the data keeps the title", async () => {
  const { cards } = await import("../src/lib/store");
  const k = cards.create({ contactId: null, title: "Mein Titel", data: defaultCardData({ recipientName: "A", address: "du", occasion: "danke" }) });
  cards.update(k.id, { title: undefined, data: k.data });
  assert.equal(cards.get(k.id)!.title, "Mein Titel");
});
