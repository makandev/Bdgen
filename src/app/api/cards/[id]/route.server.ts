import { normalizeCardData, str } from "@/lib/validate";
import { cards, contacts } from "@/server/db";
import { body, fail, handle, json } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export function GET(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const card = cards.get(id);
    if (!card) return fail("Diese Karte gibt es nicht.", 404);
    return json({ card, contact: card.contactId ? contacts.get(card.contactId) : null });
  });
}

export function PUT(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const cur = cards.get(id);
    if (!cur) return fail("Diese Karte gibt es nicht.", 404);
    const b = await body(req);
    const card = cards.update(id, {
      title: b.title === undefined ? undefined : str(b.title, cur.title, 120),
      shared: typeof b.shared === "boolean" ? b.shared : undefined,
      data: b.data === undefined ? undefined : normalizeCardData(b.data, cur.data),
    });
    return json({ card });
  });
}

export function DELETE(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    cards.remove(id);
    return json({ ok: true });
  });
}
