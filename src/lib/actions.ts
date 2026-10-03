import { aiEnabled } from "./ai";
import { occasionLabel, PRESETS } from "./presets";
import { generateCard, type Brief } from "./prompts";
import { cards, contacts } from "./store";
import { defaultCardData } from "./templates";
import type { Card, Contact } from "./types";

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

export async function createCardFor(
  contact: Contact,
  opts: { preset: string; mode: "ai" | "template"; extra: string },
): Promise<{ card: Card; warning?: string }> {
  const preset = PRESETS[opts.preset] ? opts.preset : "gold";
  const data = defaultCardData({ recipientName: contact.name, address: contact.address, occasion: contact.occasion, preset });
  const title = `${occasionLabel(contact.occasion)} ${new Date().getFullYear()}`;
  let card = cards.create({ contactId: contact.id, title, data });
  if (opts.mode !== "ai") return { card };
  if (!aiEnabled()) return { card, warning: "Keine KI eingerichtet – die Karte wurde aus der Vorlage erstellt." };
  try {
    const gen = await generateCard(briefFor(card), opts.extra);
    card = cards.update(card.id, { data: { ...data, scenes: gen.scenes, cinema: gen.cinema, topLine: gen.topLine } })!;
    return { card };
  } catch (e) {
    return { card, warning: `Die KI war nicht erreichbar, deshalb wurde die Karte aus der Vorlage erstellt. ${e instanceof Error ? e.message : ""}` };
  }
}
