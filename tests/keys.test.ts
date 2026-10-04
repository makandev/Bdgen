import { test } from "node:test";
import assert from "node:assert/strict";
import * as settings from "../src/lib/settings";

function memStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), dump: () => [...m.values()].join("\n") };
}
const local = memStorage();
let session = memStorage();
Object.assign(globalThis, { localStorage: local, sessionStorage: session });

const KEY = "AIzaSyTEST-not-a-real-key-1234567890abc";

test("keys stay on the device; with a device password only ciphertext is stored", async () => {
  await settings.saveAI({ source: "manual", gemini: KEY });
  assert.equal(settings.getAI()?.gemini, KEY);
  assert.equal(settings.hasDeviceLock(), false);

  await settings.protectAI(settings.getAI()!, "geheim-123");
  assert.ok(!local.dump().includes(KEY), "plain key must not stay in localStorage");
  assert.equal(settings.getAI()?.gemini, KEY, "unlocked in this session");

  // New tab / app start: session is empty → locked.
  session = memStorage();
  Object.assign(globalThis, { sessionStorage: session });
  assert.equal(settings.isLocked(), true);
  assert.equal(settings.getAI(), null);
  await assert.rejects(settings.unlockAI("falsch"), /Falsches Passwort/);
  await settings.unlockAI("geheim-123");
  assert.equal(settings.getAI()?.gemini, KEY);

  // Changing keys needs the password; the wrong one is rejected.
  await assert.rejects(settings.saveAI({ source: "manual", gemini: "neu" }));
  await assert.rejects(settings.saveAI({ source: "manual", gemini: "neu" }, "falsch"));
  await settings.saveAI({ source: "manual", gemini: "neu" }, "geheim-123");
  assert.equal(settings.getAI()?.gemini, "neu");

  settings.lockAI();
  assert.equal(settings.isLocked(), true);
  settings.clearAI();
  assert.equal(settings.hasDeviceLock(), false);
  assert.equal(settings.getAI(), null);
});

test("keys from the old published vault are ignored", () => {
  local.setItem("bdgen:ai", JSON.stringify({ source: "vault", gemini: KEY }));
  assert.equal(settings.getAI(), null);
});
