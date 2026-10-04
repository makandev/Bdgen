/**
 * Random UUID (v4). crypto.randomUUID needs iOS 15.4 and a secure context (fails on
 * http://<ip>:3000 in the home network) – getRandomValues works everywhere.
 */
export function newId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Deep copy of plain JSON data (structuredClone needs iOS 15.4). */
export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
