import { NextResponse } from "next/server";
import { AIError } from "./ai";
import { cards, contacts, type ContactInput } from "./db";
import type { Brief } from "./prompts";
import type { Card } from "./types";
import { address, occasion, str } from "./validate";

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

export function contactInput(b: Record<string, unknown>): ContactInput | string {
  const name = str(b.name, "", 80).trim();
  if (!name) return "Bitte einen Namen bzw. eine Anrede angeben.";
  return {
    name,
    relation: str(b.relation, "", 60).trim(),
    address: address(b.address),
    occasion: occasion(b.occasion),
    date: str(b.date, "", 20),
    mood: Array.isArray(b.mood) ? b.mood.map((m) => str(m, "", 30)).filter(Boolean).slice(0, 8) : [],
    notes: str(b.notes, "", 4000),
  };
}

/** Context for the AI. Deliberately excludes the recipient's name. */
export function briefFor(card: Card): Brief {
  const c = card.contactId ? contacts.get(card.contactId) : null;
  return {
    relation: c?.relation ?? "",
    address: card.data.address,
    occasion: card.data.occasion,
    mood: c?.mood ?? [],
    notes: c?.notes ?? "",
  };
}

export function loadCard(id: string): Card | null {
  return cards.get(id);
}
