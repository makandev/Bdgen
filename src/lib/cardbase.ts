import { EXAMPLES, exampleCard } from "./examples";
import { occasionLabel, PRESETS, presetEffects, presetTheme } from "./presets";
import type { Brief } from "./prompts";
import { defaultCardData, defaultCinema, defaultReactions, defaultScenes, giftScene, withGift } from "./templates";
import type { Card, CardData, Contact } from "./types";

export interface CreateOpts {
  preset: string;
  mode: "ai" | "template";
  extra: string;
  /** Id of a gallery example to start from (design, effects and – if they fit – texts). */
  example?: string;
  /** What is given as a present – gets its own unwrapping page. */
  gift?: string;
}

/** Context for the AI. Deliberately excludes the recipient's name. */
export function briefFromCard(card: Card, contact: Contact | null): Brief {
  const gift = card.data.scenes.find((s) => s.type === "gift");
  return {
    relation: contact?.relation ?? "",
    address: card.data.address,
    occasion: card.data.occasion,
    mood: contact?.mood ?? [],
    notes: contact?.notes ?? "",
    gift: gift && gift.type === "gift" ? gift.gift : undefined,
  };
}

function finish(data: CardData, contact: Contact, opts: CreateOpts): CardData {
  if (opts.gift?.trim()) data.scenes = withGift(data.scenes, giftScene(contact.address, opts.gift));
  data.reactions = defaultReactions(contact.occasion, contact.address, contact.mood);
  return data;
}

/** Starting point for a new card, shared by the browser and the server version. */
export function startData(contact: Contact, opts: CreateOpts): { data: CardData; title: string; aiExtra: string } {
  const title = `${occasionLabel(contact.occasion)} ${new Date().getFullYear()}`;
  const ex = opts.example ? EXAMPLES.find((e) => e.id === opts.example) : undefined;
  if (!ex) {
    const preset = PRESETS[opts.preset] ? opts.preset : "gold";
    const data = defaultCardData({ recipientName: contact.name, address: contact.address, occasion: contact.occasion, preset });
    return { data: finish(data, contact, opts), title, aiExtra: opts.extra };
  }
  const data = exampleCard(ex);
  data.recipientName = contact.name;
  // Example texts are written for one occasion and du/Sie form; otherwise start from the matching template.
  if (ex.address !== contact.address || ex.occasion !== contact.occasion) {
    data.scenes = defaultScenes(contact.occasion, contact.address);
    data.cinema = defaultCinema(contact.occasion, contact.address);
  }
  data.address = contact.address;
  data.occasion = contact.occasion;
  if (PRESETS[opts.preset] && opts.preset !== ex.preset) {
    data.theme = presetTheme(opts.preset);
    data.effects = presetEffects(opts.preset);
  }
  const hint =
    `Stil-Vorbild (nur Tonfall, Humor und Länge übernehmen – KEINE Inhalte oder Fakten daraus): ` +
    `Begrüßung „${ex.greeting}“, gestrichene Dinge „${ex.list.join("“, „")}“, Wunsch „${ex.quote}“.`;
  return { data: finish(data, contact, opts), title, aiExtra: [opts.extra.trim(), hint].filter(Boolean).join("\n") };
}
