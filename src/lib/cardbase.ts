import { EXAMPLES, exampleCard } from "./examples";
import { occasionLabel, PRESETS, presetEffects, presetTheme } from "./presets";
import type { Brief, Generated } from "./prompts";
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
  return {
    relation: contact?.relation ?? "",
    address: card.data.address,
    occasion: card.data.occasion,
    mood: contact?.mood ?? [],
    notes: contact?.notes ?? "",
    gift: giftOf(card.data),
  };
}

/** What the card gives as a present (text of its gift page), if it has one. */
export function giftOf(d: CardData): string | undefined {
  const g = d.scenes.find((s) => s.type === "gift");
  return g && g.type === "gift" ? g.gift : undefined;
}

/** New AI texts on top of a card. The AI never sees vouchers or the signature, so they are carried over. */
export function withGenerated(data: CardData, gen: Pick<Generated, "scenes" | "cinema" | "topLine" | "reactions" | "variant" | "provider">): CardData {
  const found = data.scenes.find((s) => s.type === "gift");
  const old = found && found.type === "gift" ? found : null;
  let scenes = gen.scenes;
  // A gift page the user added never disappears just because the AI left it out.
  if (old && !scenes.some((s) => s.type === "gift")) scenes = withGift(scenes, old);
  if (old?.voucher) scenes = scenes.map((s) => (s.type === "gift" && !s.voucher ? { ...s, voucher: old.voucher } : s));
  // Same for the handwritten signature on the finale.
  const fin = data.scenes.find((s) => s.type === "finale");
  const ink = fin && fin.type === "finale" ? fin.ink : undefined;
  scenes = scenes.map((s) => (s.type === "finale" ? (ink?.length ? { ...s, ink } : (({ ink: _drop, ...rest }) => rest)(s)) : s));
  return { ...data, scenes, cinema: gen.cinema, topLine: gen.topLine, reactions: gen.reactions, meta: { variant: gen.variant, provider: gen.provider } };
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
  // A gallery gift page stays, but its demo code never ends up in a real card.
  if (ex.gift && !data.scenes.some((s) => s.type === "gift")) data.scenes = withGift(data.scenes, giftScene(contact.address, ex.gift));
  data.scenes = data.scenes.map((s) => (s.type === "gift" && s.voucher ? { ...s, voucher: { ...s.voucher, code: "" } } : s));
  if (PRESETS[opts.preset] && opts.preset !== ex.preset) {
    data.theme = presetTheme(opts.preset);
    data.effects = presetEffects(opts.preset);
  }
  const hint =
    `Stil-Vorbild (nur Tonfall, Humor und Länge übernehmen – KEINE Inhalte oder Fakten daraus): ` +
    `Begrüßung „${ex.greeting}“, gestrichene Dinge „${ex.list.join("“, „")}“, Wunsch „${ex.quote}“.`;
  return { data: finish(data, contact, opts), title, aiExtra: [opts.extra.trim(), hint].filter(Boolean).join("\n") };
}
