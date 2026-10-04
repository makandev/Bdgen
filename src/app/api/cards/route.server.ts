import { aiEnabledFor } from "@/lib/ai";
import { startData, withGenerated } from "@/lib/cardbase";
import { generateCard } from "@/lib/prompts";
import { str } from "@/lib/validate";
import { cards, contacts } from "@/server/db";
import { body, briefFor, CARD_BODY_MAX, fail, handle, json, serverAI, serverGenOptions } from "@/server/http";

export function POST(req: Request) {
  return handle(async () => {
    const b = await body(req, CARD_BODY_MAX);
    const contact = typeof b.contactId === "string" ? contacts.get(b.contactId) : null;
    if (!contact) return fail("Diese Person gibt es nicht.", 404);
    const { data, title, aiExtra } = startData(contact, {
      preset: str(b.preset, "gold", 40),
      mode: b.mode === "ai" ? "ai" : "template",
      extra: str(b.extra, "", 1000),
      example: typeof b.example === "string" ? b.example : undefined,
      gift: str(b.gift, "", 160),
    });
    let card = cards.create({ contactId: contact.id, title, data });
    let warning: string | undefined;
    if (b.mode === "ai") {
      const cfg = serverAI();
      if (!aiEnabledFor(cfg)) {
        warning = "Auf dem Server ist keine KI eingerichtet – die Karte wurde aus der Vorlage erstellt.";
      } else {
        try {
          const gen = await generateCard(briefFor(card), aiExtra, cfg, serverGenOptions(card));
          card = cards.update(card.id, {
            data: withGenerated(data, gen),
          })!;
        } catch (e) {
          warning = `Die KI war nicht erreichbar, deshalb wurde die Karte aus der Vorlage erstellt. ${e instanceof Error ? e.message : ""}`;
        }
      }
    }
    return json({ card, warning }, 201);
  });
}
