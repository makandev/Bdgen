import { body, briefFor, fail, handle, json } from "@/lib/api";
import { aiEnabled } from "@/lib/ai";
import { cards, contacts } from "@/lib/db";
import { occasionLabel, PRESETS } from "@/lib/presets";
import { generateCard } from "@/lib/prompts";
import { defaultCardData } from "@/lib/templates";
import { str } from "@/lib/validate";

export function GET(req: Request) {
  return handle(() => {
    const contactId = new URL(req.url).searchParams.get("contactId") ?? undefined;
    return json({ cards: cards.list(contactId) });
  });
}

export function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const contact = typeof b.contactId === "string" ? contacts.get(b.contactId) : null;
    if (!contact) return fail("Kontakt nicht gefunden.", 404);
    const preset = typeof b.preset === "string" && PRESETS[b.preset] ? b.preset : "gold";
    const data = defaultCardData({
      recipientName: contact.name,
      address: contact.address,
      occasion: contact.occasion,
      preset,
    });
    const title = `${occasionLabel(contact.occasion)} ${new Date().getFullYear()}`;
    let card = cards.create({ contactId: contact.id, title, data });

    let warning: string | undefined;
    if (b.mode === "ai") {
      if (!aiEnabled()) {
        warning = "Kein KI-Schlüssel hinterlegt – die Karte wurde aus der Vorlage erstellt.";
      } else {
        try {
          const gen = await generateCard(briefFor(card), str(b.extra, "", 1000));
          card = cards.update(card.id, { data: { ...data, ...gen } })!;
        } catch (e) {
          warning = `KI nicht erreichbar, Karte wurde aus der Vorlage erstellt. (${e instanceof Error ? e.message : e})`;
        }
      }
    }
    return json({ card, warning }, 201);
  });
}
