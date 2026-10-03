export const SESSION_COOKIE = "bdgen_session";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.APP_PASSWORD;
  if (!s) throw new Error("APP_PASSWORD ist nicht gesetzt (siehe .env.example).");
  return "bdgen:" + s;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return `${exp}.${await hmac(String(exp))}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEqual(sig, await hmac(exp));
}

export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  // Compare digests so the comparison is constant-time regardless of length.
  const [a, b] = await Promise.all([hmac("pw:" + input), hmac("pw:" + expected)]);
  return safeEqual(a, b);
}
