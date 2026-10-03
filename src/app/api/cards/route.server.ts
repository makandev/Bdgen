import { aiEnabledFor } from "@/lib/ai";
import { occasionLabel, PRESETS } from "@/lib/presets";
import { generateCard } from "@/lib/prompts";
import { defaultCardData } from "@/lib/templates";
import { str } from "@/lib/validate";
import { cards, contacts } from "@/server/db";
import { body, briefFor, fail, handle, json, serverAI } from "@/server/http";

export function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const contact = typeof b.contactId === "string" ? contacts.get(b.contactId) : null;
    if (!contact) return fail("Diese Person gibt es nicht.", 404);
    const preset = typeof b.preset === "string" && PRESETS[b.preset] ? b.preset : "gold";
    const data = defaultCardData({ recipientName: contact.name, address: contact.address, occasion: contact.occasion, preset });
    let card = cards.create({ contactId: contact.id, title: `${occasionLabel(contact.occasion)} ${new Date().getFullYear()}`, data });
    let warning: string | undefined;
    if (b.mode === "ai") {
      const cfg = serverAI();
      if (!aiEnabledFor(cfg)) {
        warning = "Auf dem Server ist keine KI eingerichtet – die Karte wurde aus der Vorlage erstellt.";
      } else {
        try {
          const gen = await generateCard(briefFor(card), str(b.extra, "", 1000), cfg);
          card = cards.update(card.id, { data: { ...data, scenes: gen.scenes, cinema: gen.cinema, topLine: gen.topLine } })!;
        } catch (e) {
          warning = `Die KI war nicht erreichbar, deshalb wurde die Karte aus der Vorlage erstellt. ${e instanceof Error ? e.message : ""}`;
        }
      }
    }
    return json({ card, warning }, 201);
  });
}
