import { cookies } from "next/headers";
import { body, fail, handle, json } from "@/server/http";
import { clientIp, Limiter } from "@/server/limit";
import { checkPassword, createSession, SESSION_COOKIE, SESSION_DAYS } from "@/server/session";

// 5 tries per minute per address, and at most 30 failed tries per 10 minutes overall.
const attempts = new Limiter(5, 60_000, 30, 10 * 60_000);

export function POST(req: Request) {
  return handle(async () => {
    const ip = clientIp(req);
    if (!attempts.take(ip)) return fail("Zu viele Versuche – bitte ein paar Minuten warten.", 429);
    const { password } = await body(req);
    if (typeof password !== "string" || !(await checkPassword(password))) {
      await new Promise((r) => setTimeout(r, 700));
      return fail("Falsches Passwort.", 401);
    }
    attempts.clear(ip);
    (await cookies()).set(SESSION_COOKIE, await createSession(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 86400,
    });
    return json({ ok: true });
  });
}
