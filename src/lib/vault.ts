import { BASE } from "./base";
import type { AIConfig } from "./settings";

/** AI keys, encrypted with the app password. Safe to publish; useless without the password. */
export interface Vault {
  v: 1;
  id: string;
  iter: number;
  salt: string;
  iv: string;
  data: string;
}

const ITERATIONS = 600_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array, iter: number) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function sealVault(config: AIConfig, password: string): Promise<Vault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(config))));
  return { v: 1, id: b64(salt).slice(0, 12), iter: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data) };
}

export async function openVault(v: Vault, password: string): Promise<AIConfig> {
  const key = await deriveKey(password, unb64(v.salt), v.iter);
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(v.iv) as BufferSource }, key, unb64(v.data) as BufferSource);
    return JSON.parse(dec.decode(plain)) as AIConfig;
  } catch {
    throw new Error("Falsches Passwort.");
  }
}

export async function fetchVault(): Promise<Vault | null> {
  try {
    const res = await fetch(`${BASE}/zugang.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const v = (await res.json()) as Vault;
    return v && v.v === 1 && v.data ? v : null;
  } catch {
    return null;
  }
}
