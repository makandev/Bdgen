import { NextResponse } from "next/server";
import { AIError } from "@/lib/ai";
import { briefFromCard } from "@/lib/cardbase";
import { chooseVariant, pickSamples } from "@/lib/learning";
import type { Brief, GenOptions } from "@/lib/prompts";
import type { AIConfig } from "@/lib/settings";
import type { Card } from "@/lib/types";
import { str } from "@/lib/validate";
import { contacts, ratings } from "./db";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function handle(fn: () => Promise<Response> | Response): Promise<Response> {
  return Promise.resolve()
    .then(fn)
    .catch((e: unknown) => {
      const message = e instanceof Error ? e.message : "Unbekannter Fehler";
      const status = e instanceof AIError ? e.status : 500;
      if (!(e instanceof AIError)) console.error(e);
      return fail(message, status);
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
