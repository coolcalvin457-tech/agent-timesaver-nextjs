// ─── Next.js Middleware ───────────────────────────────────────────────────────
//
// Reads the paa_session cookie on every request. Does NOT block any pages.
// In v1, no pages require login. This middleware simply makes the cookie
// available to server components and enables future protected route checks.
//
// The auth state is read client-side via AuthProvider (/api/auth/me).
// This middleware exists for:
//   1. Future protected routes (redirect to /login if needed)
//   2. Lightweight cookie presence check without DB hits

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // For now, just pass through. The cookie is automatically sent with
  // every request and read by /api/auth/me when needed.
  //
  // Future: add redirect logic here for protected routes, e.g.:
  // if (request.nextUrl.pathname.startsWith('/dashboard') && !request.cookies.get('paa_session')) {
  //   return NextResponse.redirect(new URL(`/login?redirect=${request.nextUrl.pathname}`, request.url));
  // }

  return NextResponse.next();
}

export const config = {
  // Run on all pages except static files and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
