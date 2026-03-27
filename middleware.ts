// ─── Next.js Middleware — Sliding Window Session ─────────────────────────────
//
// Runs on every page request (not API routes or static files).
// Reads the paa_session JWT cookie and checks when it was issued.
// If the token is valid but was issued more than 24 hours ago, re-signs it
// with a fresh 30-day expiry. Both paa_session and paa_name cookies are
// refreshed together so they never drift out of sync.
//
// Result: the session only expires if the user is inactive for 30 consecutive
// days. Every visit within the window resets the clock.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "paa_session";
const NAME_COOKIE = "paa_name";
const SESSION_DAYS = 30;
const REFRESH_AFTER_HOURS = 24;

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return NextResponse.next();

  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(cookie.value, secret);

    // Only refresh if issued more than 24 hours ago
    const iat = payload.iat;
    if (!iat) return NextResponse.next();

    const ageMs = Date.now() - iat * 1000;
    const thresholdMs = REFRESH_AFTER_HOURS * 60 * 60 * 1000;

    if (ageMs < thresholdMs) return NextResponse.next();

    // Re-sign JWT with fresh 30-day expiry
    const newToken = await new SignJWT({
      sub: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      jobTitle: payload.jobTitle,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DAYS}d`)
      .sign(secret);

    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.next();

    // Refresh the HTTP-only session cookie
    response.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // Refresh the client-readable name cookie (prevents nav blink)
    const firstName = payload.firstName as string;
    if (firstName) {
      response.cookies.set(NAME_COOKIE, firstName, {
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge,
      });
    }

    return response;
  } catch {
    // Token invalid or expired — pass through, AuthProvider handles the rest
    return NextResponse.next();
  }
}

export const config = {
  // Run on all pages except static files and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
