import type { Provider } from "./ai";
import { openVault, sealVault, type Vault } from "./vault";

export interface AIConfig {
  gemini?: string;
  openrouter?: string;
  geminiModel?: string;
  openrouterModel?: string;
  provider?: Provider | "";
  openrouterBaseUrl?: string;
}

export interface StoredAI extends AIConfig {
  source: "manual";
}

/*
 * AI keys live only on this device – never on GitHub or in the published site.
 *  - Without a device password: plain in localStorage (like any app's settings).
 *  - With a device password: only the encrypted form stays in localStorage; the readable keys
 *    exist in sessionStorage of the open tab/app after unlocking and vanish when it closes.
 */
const KEY = "bdgen:ai";
const LOCKED = "bdgen:ai-locked";
const SESSION = "bdgen:ai-session";
const INTRO = "bdgen:intro-seen";

function read<T>(store: Storage | undefined, key: string): T | null {
  try {
    return JSON.parse(store?.getItem(key) || "null") as T | null;
  } catch {
    return null;
  }
}

const local = () => (typeof localStorage === "undefined" ? undefined : localStorage);
const session = () => (typeof sessionStorage === "undefined" ? undefined : sessionStorage);

export function getAI(): StoredAI | null {
  if (hasDeviceLock()) return read<StoredAI>(session(), SESSION);
  const v = read<StoredAI & { source?: string }>(local(), KEY);
  // Older versions could store keys from a published vault – those are not used anymore.
  if (!v || v.source !== "manual") return null;
  return v;
}

/** Keys protected by a device password exist on this device. */
export function hasDeviceLock(): boolean {
  return !!read<Vault>(local(), LOCKED);
}

/** Device password set, but not entered in this tab/app session yet. */
export function isLocked(): boolean {
  return hasDeviceLock() && !read<StoredAI>(session(), SESSION);
}

/** Saves keys. With a device password, the password is needed to encrypt them again. */
export async function saveAI(v: StoredAI, password?: string): Promise<void> {
  if (hasDeviceLock()) {
    if (!password) throw new Error("Bitte das Geräte-Passwort eingeben, um die Schlüssel zu speichern.");
    await unlockAI(password); // proves it is the right password
    await protectAI(v, password);
    return;
  }
  local()?.setItem(KEY, JSON.stringify(v));
}

/** Turns on the device password: from now on only the encrypted keys are kept. */
export async function protectAI(v: StoredAI, password: string): Promise<void> {
  if (password.length < 6) throw new Error("Das Passwort sollte mindestens 6 Zeichen haben.");
  const sealed = await sealVault(v, password);
  local()?.setItem(LOCKED, JSON.stringify(sealed));
  local()?.removeItem(KEY);
  session()?.setItem(SESSION, JSON.stringify(v));
}

export async function unlockAI(password: string): Promise<void> {
  const sealed = read<Vault>(local(), LOCKED);
  if (!sealed) return;
  const cfg = await openVault(sealed, password);
  session()?.setItem(SESSION, JSON.stringify({ ...cfg, source: "manual" }));
}

/** Locks again right away (the encrypted keys stay). */
export function lockAI() {
  session()?.removeItem(SESSION);
}

/** Turns the device password off again; needs the keys to be unlocked. */
export function removeProtection() {
  const v = getAI();
  if (!v) throw new Error("Bitte zuerst entsperren.");
  local()?.setItem(KEY, JSON.stringify(v));
  local()?.removeItem(LOCKED);
  session()?.removeItem(SESSION);
}

/** Removes all keys from this device (e.g. "password forgotten"). Persons and cards stay. */
export function clearAI() {
  local()?.removeItem(KEY);
  local()?.removeItem(LOCKED);
  session()?.removeItem(SESSION);
}

export function introSeen(): boolean {
  try {
    return localStorage.getItem(INTRO) === "1";
  } catch {
    return true;
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(INTRO, "1");
  } catch {}
}

const LEARN = "bdgen:learn-samples";

/** Whether liked texts may be kept (without names) as style examples. Default: yes. */
export function learnFromTexts(): boolean {
  try {
    return localStorage.getItem(LEARN) !== "0";
  } catch {
    return true;
  }
}

export function setLearnFromTexts(on: boolean) {
  try {
    localStorage.setItem(LEARN, on ? "1" : "0");
  } catch {}
}
