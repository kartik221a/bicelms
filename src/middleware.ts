import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: cheap cookie-presence gate for protected areas. REAL
 * verification (signature + role + status) happens server-side in layouts and
 * API routes — this only saves unauthenticated users a round trip (§14).
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-courses",
  "/my-notes",
  "/my-resources",
  "/learn",
  "/certificates",
  "/orders",
  "/profile",
  "/settings",
  "/admin",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.has("bice_session") && req.cookies.get("bice_session")?.value;
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-courses/:path*",
    "/my-notes/:path*",
    "/my-resources/:path*",
    "/learn/:path*",
    "/certificates/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
