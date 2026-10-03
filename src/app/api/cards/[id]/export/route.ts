import { cards } from "@/lib/db";
import { renderCardHTML } from "@/lib/render";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const card = cards.get(id);
  if (!card) return new Response("Nicht gefunden", { status: 404 });
  const base = card.data.recipientName
    .normalize("NFKD")
    .replace(/ß/g, "ss")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_") || "Karte";
  const filename = `Fuer_${base}.html`;
  return new Response(renderCardHTML(card.data, { exportFile: true }), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
