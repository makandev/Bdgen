import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
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

/** Packs a card into a URL-safe string: "1" + deflate-raw + base64url ("0" = uncompressed, still readable). */
export async function encodeCard(d: CardData): Promise<string> {
  return "1" + toB64url(deflateSync(strToU8(JSON.stringify(d)), { level: 9 }));
}

/** Decodes and validates a shared card. Anything from a link is untrusted, so it is always normalized. */
export async function decodeCard(s: string): Promise<CardData | null> {
  try {
    const kind = s[0];
    let bytes = fromB64url(s.slice(1));
    if (kind === "1") bytes = inflateSync(bytes);
    else if (kind !== "0") return null;
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
