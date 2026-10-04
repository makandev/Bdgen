import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AIError } from "@/lib/ai";
import { briefFromCard } from "@/lib/cardbase";
import { PublicError } from "@/lib/errors";
import { chooseVariant, pickSamples } from "@/lib/learning";
import type { Brief, GenOptions } from "@/lib/prompts";
import type { AIConfig } from "@/lib/settings";
import type { Card } from "@/lib/types";
import { str } from "@/lib/validate";
import { contacts, ratings, sessions } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Largest request body by default (people, ratings, login …). */
export const BODY_MAX = 512 * 1024;
/** Cards may carry a voucher photo and original PDF (see MAX_IMAGE_CHARS/MAX_PDF_CHARS). */
export const CARD_BODY_MAX = 6 * 1024 * 1024;

export async function body(req: Request, max = BODY_MAX): Promise<Record<string, unknown>> {
  const tooBig = () => new PublicError("Die Daten sind zu groß.", 413);
  if (Number(req.headers.get("content-length") || 0) > max) throw tooBig();
  const text = await req.text();
  if (text.length > max) throw tooBig();
  try {
    const b = JSON.parse(text);
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** True when the request carries a login that is still valid after "log out everywhere". */
export async function loggedIn(): Promise<boolean> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value, sessions.generation());
}

/**
 * Runs a route handler. Unless `open` is set, it first checks the login including its generation –
 * the edge proxy cannot read the database, so old logins are only refused here.
 */
export function handle(fn: () => Promise<Response> | Response, { open = false } = {}): Promise<Response> {
  return Promise.resolve()
    .then(async () => (open || (await loggedIn()) ? fn() : fail("Nicht angemeldet", 401)))
    .catch((e: unknown) => {
      if (e instanceof AIError || e instanceof PublicError) return fail(e.message, e.status);
      // Anything else may contain internal details (paths, SQL) – log it, show a plain message.
      console.error(e);
      return fail("Da ist auf dem Server etwas schiefgelaufen. Bitte später noch einmal versuchen.", 500);
    });
}

/** AI keys live only in the server environment and never reach the browser. */
export function serverAI(): AIConfig | null {
  const env = (k: string) => process.env[k]?.trim() || undefined;
  const cfg: AIConfig = {
    gemini: env("GEMINI_API_KEY"),
    openrouter: env("OPENROUTER_API_KEY"),
    geminiModel: env("GEMINI_MODEL"),
    openrouterModel: env("OPENROUTER_MODEL"),
    openrouterBaseUrl: env("OPENROUTER_BASE_URL"),
    provider: env("AI_PROVIDER") as AIConfig["provider"],
  };
  return cfg.gemini || cfg.openrouter ? cfg : null;
}

/** Context for the AI. Deliberately excludes the recipient's name. */
export function briefFor(card: Card): Brief {
  return briefFromCard(card, card.contactId ? contacts.get(card.contactId) : null);
}

/** Learning on the server: writing style and style examples from all ratings. */
export function serverGenOptions(card: Card, rawFeedback?: unknown): GenOptions {
  const rs = ratings.list();
  const f = rawFeedback && typeof rawFeedback === "object" ? (rawFeedback as Record<string, unknown>) : null;
  return {
    variant: chooseVariant(rs),
    samples: pickSamples(rs, card.data.occasion, card.data.address),
    feedback: f
      ? {
          reasons: Array.isArray(f.reasons) ? f.reasons.map((x) => str(x, "", 40)).filter(Boolean).slice(0, 8) : [],
          text: str(f.text, "", 300),
          previous: str(f.previous, "", 400),
        }
      : undefined,
  };
}
