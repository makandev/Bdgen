import { NextResponse, type NextRequest } from "next/server";
import { authSetupProblem, SESSION_COOKIE, verifySession } from "@/server/session";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const PUBLIC = [/^\/login\/?$/, /^\/api\/(login|health)\/?$/, /^\/api\/react\/[A-Za-z0-9]+\/?$/, /^\/k(\/[^/]+)?\/?$/, /^\/(manifest\.webmanifest|icon-\d+\.png|apple-touch-icon\.png|icon\.svg)$/];

// Runs on the edge: no database here, so "log out everywhere" is checked again in handle() (http.ts).
// Never set runtime: "nodejs" in config – Next then silently drops the proxy (see 10-stolperfallen.md).
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname.slice(BASE.length) || "/";
  if (PUBLIC.some((r) => r.test(path))) return NextResponse.next();

  const problem = authSetupProblem();
  if (problem) {
    return new NextResponse(problem, {
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
