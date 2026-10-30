import { NextRequest, NextResponse } from "next/server";
import { APP_CONFIG } from "@/config/constants";
import { verifySessionToken } from "@/lib/auth/jwt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/events",
  "/calendar",
  "/achievements",
  "/reports",
  "/assistant",
  "/profile",
];

/**
 * F1.9: Protected routes redirect to /login with a `next` parameter when
 * no valid session exists.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get(APP_CONFIG.sessionCookieName)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/calendar/:path*",
    "/achievements/:path*",
    "/reports/:path*",
    "/assistant/:path*",
    "/profile/:path*",
  ],
};
