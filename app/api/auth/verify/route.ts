// ─── GET /api/auth/verify ────────────────────────────────────────────────────
//
// Magic link landing endpoint. User clicks the link in their email and hits
// this route. Validates the token, sets the session cookie, and redirects.
//
// Why a Route Handler instead of a Server Component?
// cookies().set() is only allowed in Route Handlers and Server Actions in
// Next.js 14. A Server Component can only READ cookies, not SET them.

import { NextRequest, NextResponse } from "next/server";
import { hashToken, findMagicLinkByTokenHash, markMagicLinkUsed, findUserByEmail } from "@/lib/db";
import { signToken } from "@/lib/auth";

const COOKIE_NAME = "paa_session";
const SESSION_DAYS = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawToken = searchParams.get("token");
  const redirectTo = searchParams.get("redirect") || "/";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://promptaiagents.com";

  // No token provided
  if (!rawToken) {
    return NextResponse.redirect(`${baseUrl}/auth/verify-error?message=no-token`);
  }

  try {
    // Look up the hashed token
    const tokenHash = hashToken(rawToken);
    const magicLink = await findMagicLinkByTokenHash(tokenHash);

    // Token not found
    if (!magicLink) {
      return NextResponse.redirect(`${baseUrl}/auth/verify-error?message=invalid`);
    }

    // Token already used
    if (magicLink.used) {
      return NextResponse.redirect(`${baseUrl}/auth/verify-error?message=used`);
    }

    // Token expired
    if (new Date() > new Date(magicLink.expires_at)) {
      return NextResponse.redirect(`${baseUrl}/auth/verify-error?message=expired`);
    }

    // Mark as used
    await markMagicLinkUsed(magicLink.id);

    // Find user
    const user = await findUserByEmail(magicLink.email);
    if (!user) {
      return NextResponse.redirect(`${baseUrl}/auth/verify-error?message=no-account`);
    }

    // Sign JWT
    const token = await signToken({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      jobTitle: user.job_title ?? undefined,
    });

    // Build redirect response with session cookie
    const response = NextResponse.redirect(`${baseUrl}${redirectTo}`);
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    // Client-readable cookie with first name (prevents nav blink on page load)
    response.cookies.set("paa_name", user.first_name, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Auth verify error:", error);
    return NextResponse.redirect(`${baseUrl}/auth/verify-error?message=error`);
  }
}
