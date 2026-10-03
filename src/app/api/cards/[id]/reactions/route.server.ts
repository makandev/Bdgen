import { reactions } from "@/server/db";
import { handle, json } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export function GET(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    return json({ reactions: reactions.forCard(id) });
  });
}
