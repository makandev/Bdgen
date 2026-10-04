import { cookies } from "next/headers";
import { sessions } from "@/server/db";
import { body, handle, json, loggedIn } from "@/server/http";
import { SESSION_COOKIE } from "@/server/session";

/** Logs out this device; with {"all": true} every device (e.g. after a lost phone). */
export function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    // Only a valid login may log out everyone (otherwise anyone could kick the owner out).
    if (b.all === true && (await loggedIn())) sessions.logoutEverywhere();
    (await cookies()).delete(SESSION_COOKIE);
    return json({ ok: true });
  }, { open: true });
}
