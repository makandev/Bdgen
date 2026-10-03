import { json } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).delete(SESSION_COOKIE);
  return json({ ok: true });
}
