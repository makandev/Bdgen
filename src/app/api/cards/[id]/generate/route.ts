import { body, briefFor, fail, handle, json } from "@/lib/api";
import { cards } from "@/lib/db";
import { generateCard } from "@/lib/prompts";
import { str } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const card = cards.get(id);
    if (!card) return fail("Karte nicht gefunden.", 404);
    const b = await body(req);
    const gen = await generateCard(briefFor(card), str(b.extra, "", 1000));
    return json(gen);
  });
}
