import { body, contactInput, fail, handle, json } from "@/lib/api";
import { cards, contacts } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export function GET(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const contact = contacts.get(id);
    if (!contact) return fail("Kontakt nicht gefunden.", 404);
    return json({ contact, cards: cards.list(id) });
  });
}

export function PUT(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const input = contactInput(await body(req));
    if (typeof input === "string") return fail(input);
    const contact = contacts.update(id, input);
    if (!contact) return fail("Kontakt nicht gefunden.", 404);
    return json({ contact });
  });
}

export function DELETE(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    for (const c of cards.list(id)) cards.remove(c.id);
    contacts.remove(id);
    return json({ ok: true });
  });
}
