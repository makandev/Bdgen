import { deflateSync, Inflate, strFromU8, strToU8 } from "fflate";
import { defaultCardData } from "./templates";
import type { CardData } from "./types";
import { address, normalizeCardData, occasion, str } from "./validate";

// fflate instead of CompressionStream: same deflate-raw format, but it also works on older iPhones (< iOS 16.4).
const toB64url = (u: Uint8Array) => {
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(u.subarray(i, i + 0x8000)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
};

/** Longest link part we try to read (a card with photo is far below this). */
export const MAX_LINK_CHARS = 300_000;
/** Most bytes a link may unpack to – stops "zip bombs" that unpack to gigabytes. */
export const MAX_CARD_BYTES = 2 * 1024 * 1024;

/** Unpacks with a hard size limit; throws as soon as the limit is passed. */
function inflateLimited(bytes: Uint8Array, max: number): Uint8Array {
  const parts: Uint8Array[] = [];
  let size = 0;
  const inf = new Inflate((chunk) => {
    size += chunk.length;
    if (size > max) throw new Error("too big");
    parts.push(chunk);
  });
  for (let i = 0; i < bytes.length; i += 0x4000) inf.push(bytes.subarray(i, i + 0x4000), i + 0x4000 >= bytes.length);
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Packs a card into a URL-safe string: "1" + deflate-raw + base64url ("0" = uncompressed, still readable). */
export async function encodeCard(d: CardData): Promise<string> {
  return "1" + toB64url(deflateSync(strToU8(JSON.stringify(d)), { level: 9 }));
}

/** Decodes and validates a shared card. Anything from a link is untrusted, so it is always normalized. */
export async function decodeCard(s: string): Promise<CardData | null> {
  try {
    if (s.length > MAX_LINK_CHARS) return null;
    const kind = s[0];
    let bytes: Uint8Array = fromB64url(s.slice(1));
    if (kind === "1") bytes = inflateLimited(bytes, MAX_CARD_BYTES);
    else if (kind !== "0" || bytes.length > MAX_CARD_BYTES) return null;
    const raw = JSON.parse(strFromU8(bytes)) as Partial<CardData>;
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
