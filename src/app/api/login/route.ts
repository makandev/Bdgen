import { body, fail, handle, json } from "@/lib/api";
import { checkPassword, createSession, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";
import { cookies } from "next/headers";

export function POST(req: Request) {
  return handle(async () => {
    const { password } = await body(req);
    if (typeof password !== "string" || !(await checkPassword(password))) {
      await new Promise((r) => setTimeout(r, 700));
      return fail("Falsches Passwort.", 401);
    }
    (await cookies()).set(SESSION_COOKIE, await createSession(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 86400,
    });
    return json({ ok: true });
  });
}
