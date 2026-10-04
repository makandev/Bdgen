import { str } from "@/lib/validate";
import { cards, reactions } from "@/server/db";
import { body, fail, handle, json } from "@/server/http";
import { clientIp, Limiter } from "@/server/limit";

type Ctx = { params: Promise<{ slug: string }> };

const MAX_PER_CARD = 30;
const MESSAGE_WINDOW_MS = 30 * 60_000;
// 10 reactions per minute per address, 120 per minute overall.
const hits = new Limiter(10, 60_000, 120, 60_000);

/** Public: the recipient reacts to a card. Only the card's own reaction options are accepted. */
export function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const now = Date.now();
    const { slug } = await ctx.params;
    const card = cards.bySlug(slug);
    if (!card || !card.shared) return fail("Nicht gefunden.", 404);
    if (!hits.take(clientIp(req))) return fail("Zu viele Reaktionen – bitte kurz warten.", 429);
    const b = await body(req);

    if (typeof b.id === "string" && typeof b.message === "string") {
      const r = reactions.get(b.id);
      if (!r || r.cardId !== card.id || now - Date.parse(r.createdAt) > MESSAGE_WINDOW_MS) return fail("Nicht mehr möglich.", 400);
      reactions.setMessage(r.id, str(b.message, "", 200).trim());
      return json({ id: r.id });
    }

    const emoji = str(b.emoji, "", 16);
    const label = str(b.label, "", 40);
    const allowed = card.data.reactions?.options ?? [];
    if (!allowed.some((o) => o.emoji === emoji && o.label === label)) return fail("Unbekannte Reaktion.", 400);
    if (reactions.count(card.id) >= MAX_PER_CARD) return fail("Genug Reaktionen für diese Karte.", 429);
    return json({ id: reactions.add(card.id, emoji, label).id }, 201);
  });
}
