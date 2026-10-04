export const SESSION_COOKIE = "bdgen_session";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

/** Why the server cannot sign logins yet, or "" when everything is set. */
export function authSetupProblem(): string {
  if (!process.env.APP_PASSWORD) return "APP_PASSWORD ist nicht gesetzt. Bitte in .env eintragen (siehe .env.example).";
  if ((process.env.AUTH_SECRET ?? "").length < 32) {
    return "AUTH_SECRET fehlt oder ist zu kurz (mindestens 32 Zeichen). Bitte in .env eintragen, z. B. mit: openssl rand -hex 32 (update.sh macht das automatisch).";
  }
  return "";
}

function secret(): string {
  const problem = authSetupProblem();
  if (problem) throw new Error(problem);
  return "bdgen:" + process.env.AUTH_SECRET;
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

/**
 * A login is "expiry.generation.signature". Raising the generation ("log out everywhere") makes
 * every older login invalid at once.
 */
export async function createSession(generation: number): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return `${exp}.${generation}.${await hmac(`${exp}.${generation}`)}`;
}

/**
 * Checks signature and expiry. Without `generation` only those are checked – that is all the
 * edge proxy can do (no database there); route handlers pass the current generation as well.
 */
export async function verifySession(token: string | undefined, generation?: number): Promise<boolean> {
  if (!token) return false;
  const [exp, gen, sig] = token.split(".");
  if (!exp || !gen || !sig || !(Number(exp) > Date.now())) return false;
  if (generation !== undefined && Number(gen) !== generation) return false;
  return safeEqual(sig, await hmac(`${exp}.${gen}`));
}

export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  // Compare digests so the comparison is constant-time regardless of length.
  const [a, b] = await Promise.all([hmac("pw:" + input), hmac("pw:" + expected)]);
  return safeEqual(a, b);
}
