import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/server/session";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const PUBLIC = [/^\/login\/?$/, /^\/api\/login\/?$/, /^\/k(\/[^/]+)?\/?$/, /^\/(manifest\.webmanifest|icon-\d+\.png|apple-touch-icon\.png|icon\.svg)$/];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname.slice(BASE.length) || "/";
  if (PUBLIC.some((r) => r.test(path))) return NextResponse.next();

  if (!process.env.APP_PASSWORD) {
    return new NextResponse("APP_PASSWORD ist nicht gesetzt. Bitte in .env eintragen (siehe .env.example).", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (path.startsWith("/api/")) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = `${BASE}/login/`;
  url.search = path === "/" ? "" : `?next=${encodeURIComponent(path + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
