import { aiEnabledFor } from "@/lib/ai";
import { restyle, restyleOffline } from "@/lib/prompts";
import { normalizeEffects, normalizeTheme, str } from "@/lib/validate";
import { cards } from "@/server/db";
import { body, fail, handle, json, serverAI } from "@/server/http";

export function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const card = typeof b.cardId === "string" ? cards.get(b.cardId) : null;
    if (!card) return fail("Diese Karte gibt es nicht.", 404);
    const instruction = str(b.instruction, "", 600).trim();
    if (!instruction) return fail("Bitte beschreiben, was sich ändern soll.");
    const theme = normalizeTheme(b.theme, card.data.theme);
    const effects = normalizeEffects(b.effects, card.data.effects);
    const cfg = serverAI();
    if (!aiEnabledFor(cfg)) return json(restyleOffline({ ...card.data, theme, effects }, instruction));
    return json(await restyle(theme, effects, instruction, cfg));
  });
}
