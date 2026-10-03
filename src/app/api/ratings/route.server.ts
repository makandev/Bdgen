import { ratings } from "@/server/db";
import { body, fail, handle, json } from "@/server/http";
import { normalizeRating } from "@/lib/validate";

export function GET() {
  return handle(() => json({ ratings: ratings.list() }));
}

export function POST(req: Request) {
  return handle(async () => {
    const r = normalizeRating(await body(req));
    if (!r) return fail("Ungültige Bewertung.");
    ratings.add(r);
    return json({ ok: true }, 201);
  });
}

export function DELETE() {
  return handle(() => {
    ratings.clear();
    return json({ ok: true });
  });
}
