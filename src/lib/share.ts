import { defaultCardData } from "./templates";
import type { CardData } from "./types";
import { address, normalizeCardData, occasion, str } from "./validate";

const toB64url = (u: Uint8Array) => {
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Packs a card into a URL-safe string: "1" + deflate+base64url, or "0" + base64url without compression. */
export async function encodeCard(d: CardData): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(d));
  if (typeof CompressionStream === "undefined") return "0" + toB64url(raw);
  return "1" + toB64url(await pipe(raw, new CompressionStream("deflate-raw")));
}

/** Decodes and validates a shared card. Anything from a link is untrusted, so it is always normalized. */
export async function decodeCard(s: string): Promise<CardData | null> {
  try {
    const kind = s[0];
    let bytes: Uint8Array = fromB64url(s.slice(1));
    if (kind === "1") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    else if (kind !== "0") return null;
    const raw = JSON.parse(new TextDecoder().decode(bytes)) as Partial<CardData>;
    const fb = defaultCardData({
      recipientName: str(raw.recipientName, "", 80),
      address: address(raw.address),
      occasion: occasion(raw.occasion),
    });
    return normalizeCardData(raw, fb);
  } catch {
    return null;
  }
}
