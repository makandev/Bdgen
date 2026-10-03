import { cookies } from "next/headers";
import { body, fail, handle, json } from "@/server/http";
import { checkPassword, createSession, SESSION_COOKIE, SESSION_DAYS } from "@/server/session";

const failures = new Map<string, { n: number; until: number }>();

export function POST(req: Request) {
  return handle(async () => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const f = failures.get(ip);
    if (f && f.until > Date.now()) return fail("Zu viele Versuche – bitte eine Minute warten.", 429);
    const { password } = await body(req);
    if (typeof password !== "string" || !(await checkPassword(password))) {
      const n = (f?.n ?? 0) + 1;
      failures.set(ip, { n, until: n >= 5 ? Date.now() + 60_000 : 0 });
      await new Promise((r) => setTimeout(r, 700));
      return fail("Falsches Passwort.", 401);
    }
    failures.delete(ip);
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
