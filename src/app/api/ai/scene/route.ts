import { body, briefFor, fail, handle, json } from "@/lib/api";
import { cards } from "@/lib/db";
import { rewriteScene } from "@/lib/prompts";
import { normalizeScene, str } from "@/lib/validate";

export function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const card = typeof b.cardId === "string" ? cards.get(b.cardId) : null;
    if (!card) return fail("Karte nicht gefunden.", 404);
    // The editor sends its current (possibly unsaved) version of the scene.
    const scene = normalizeScene(b.scene, card.data.address);
    if (!scene) return fail("Ungültige Szene.");
    return json(await rewriteScene(briefFor(card), scene, str(b.instruction, "", 600)));
  });
}
