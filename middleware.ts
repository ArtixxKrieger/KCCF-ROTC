import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { canAccessPage, homeForRole } from "@/lib/rbac";

const PUBLIC_PATHS = new Set(["/", "/login"]);
const PUBLIC_API = new Set(["/api/login", "/api/logout", "/api/signup"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api")) {
    if (PUBLIC_API.has(pathname)) return NextResponse.next();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!user && !PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(user.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && !canAccessPage(user.role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(user.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
