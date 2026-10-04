import { rewriteScene } from "@/lib/prompts";
import { normalizeScene, str } from "@/lib/validate";
import { cards } from "@/server/db";
import { body, briefFor, CARD_BODY_MAX, fail, handle, json, serverAI } from "@/server/http";

export function POST(req: Request) {
  return handle(async () => {
    const b = await body(req, CARD_BODY_MAX);
    const card = typeof b.cardId === "string" ? cards.get(b.cardId) : null;
    if (!card) return fail("Diese Karte gibt es nicht.", 404);
    // The editor sends its current (possibly unsaved) version of the scene.
    const scene = normalizeScene(b.scene, card.data.address);
    if (!scene) return fail("Ungültige Seite.");
    return json(await rewriteScene(briefFor(card), scene, str(b.instruction, "", 600), serverAI()));
  });
}
