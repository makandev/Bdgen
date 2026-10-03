import { body, fail, handle, json } from "@/lib/api";
import { aiEnabled } from "@/lib/ai";
import { cards } from "@/lib/db";
import { restyle, restyleOffline } from "@/lib/prompts";
import { normalizeEffects, normalizeTheme, str } from "@/lib/validate";

export function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const card = typeof b.cardId === "string" ? cards.get(b.cardId) : null;
    if (!card) return fail("Karte nicht gefunden.", 404);
    const instruction = str(b.instruction, "", 600).trim();
    if (!instruction) return fail("Bitte beschreiben, was sich ändern soll.");
    const theme = normalizeTheme(b.theme, card.data.theme);
    const effects = normalizeEffects(b.effects, card.data.effects);
    if (!aiEnabled()) return json({ ...restyleOffline({ ...card.data, theme, effects }, instruction), provider: "offline" });
    return json(await restyle(theme, effects, instruction));
  });
}
