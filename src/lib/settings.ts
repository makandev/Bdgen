import type { Provider } from "./ai";

export interface AIConfig {
  gemini?: string;
  openrouter?: string;
  geminiModel?: string;
  openrouterModel?: string;
  provider?: Provider | "";
  openrouterBaseUrl?: string;
}

export interface StoredAI extends AIConfig {
  source: "vault" | "manual";
  vaultId?: string;
  expires?: number;
}

const KEY = "bdgen:ai";
const INTRO = "bdgen:intro-seen";
export const UNLOCK_DAYS = 30;

export function getAI(): StoredAI | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null") as StoredAI | null;
    if (!v) return null;
    if (v.expires && v.expires < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

export function setAI(v: StoredAI) {
  localStorage.setItem(KEY, JSON.stringify(v));
}

export function clearAI() {
  localStorage.removeItem(KEY);
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
