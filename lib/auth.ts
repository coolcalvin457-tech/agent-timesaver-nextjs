// ─── JWT + cookie helpers for magic link auth ───────────────────────────────
//
// Uses jose for JWT (lightweight, Edge-compatible, no native deps).
// Cookie: paa_session, HTTP-only, Secure, SameSite=Lax, 30-day expiry.

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

// ─── Constants ───────────────────────────────────────────────────────────────

const COOKIE_NAME = "paa_session";
const SESSION_DAYS = 30;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  jobTitle?: string;
}

interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  firstName: string;
  jobTitle?: string;
}

// ─── Secret ──────────────────────────────────────────────────────────────────

/** Get the JWT secret as a Uint8Array (required by jose). */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET env var is not set");
  }
  return new TextEncoder().encode(secret);
}

// ─── JWT operations ──────────────────────────────────────────────────────────

/** Sign a JWT for the given user. Expires in 30 days. */
export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    firstName: user.firstName,
    jobTitle: user.jobTitle,
  } as TokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

/** Verify and decode a JWT. Returns null if invalid or expired. */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const p = payload as TokenPayload;
    if (!p.sub || !p.email || !p.firstName) return null;
    return {
      id: p.sub,
      email: p.email,
      firstName: p.firstName,
      jobTitle: p.jobTitle,
    };
  } catch {
    return null;
  }
}

// ─── Cookie operations ───────────────────────────────────────────────────────

/** Set the session cookie with a signed JWT. */
export async function setSessionCookie(user: AuthUser): Promise<void> {
  const token = await signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60, // 30 days in seconds
  });
}

/** Read the session cookie and return the user, or null if not logged in. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyToken(cookie.value);
}

/** Clear the session cookie (logout). */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
