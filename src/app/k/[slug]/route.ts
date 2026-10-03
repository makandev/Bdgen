import { cards } from "@/lib/db";
import { renderCardHTML } from "@/lib/render";

type Ctx = { params: Promise<{ slug: string }> };

const NOT_FOUND = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nicht gefunden</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fbf7ed;color:#342813;font:18px/1.6 Georgia,serif;text-align:center;padding:24px">
<div><div style="font-size:2.4rem">✦</div><p>Diese Überraschung ist nicht (mehr) verfügbar.</p></div></body></html>`;

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const card = cards.bySlug(slug);
  const headers = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow",
    "referrer-policy": "no-referrer",
  };
  if (!card || !card.shared) return new Response(NOT_FOUND, { status: 404, headers });
  return new Response(renderCardHTML(card.data), { headers });
}
