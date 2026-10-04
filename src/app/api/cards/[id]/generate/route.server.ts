import { generateCard } from "@/lib/prompts";
import { str } from "@/lib/validate";
import { cards } from "@/server/db";
import { body, briefFor, fail, handle, json, serverAI, serverGenOptions } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const card = cards.get(id);
    if (!card) return fail("Diese Karte gibt es nicht.", 404);
    const b = await body(req);
    const brief = briefFor(card);
    if ("gift" in b) brief.gift = typeof b.gift === "string" && b.gift.trim() ? str(b.gift, "", 160) : undefined;
    return json(await generateCard(brief, str(b.extra, "", 1000), serverAI(), serverGenOptions(card, b.feedback)));
  });
}
