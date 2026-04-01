// ─── GET /api/auth/me ────────────────────────────────────────────────────────
//
// Reads JWT from cookie, then re-validates against the database.
// Returns user data or { user: null }.
// Used by client components (AuthProvider) to check auth state.
//
// DB re-check serves two purposes:
//   1. Detect suspended accounts — cookie is cleared immediately.
//   2. Ensure the user record still exists (e.g. manual DB cleanup).

import { NextResponse } from "next/server";
import { getSessionUser, clearSessionCookie } from "@/lib/auth";
import { findUserById } from "@/lib/db";

export async function GET() {
  try {
    // Step 1: Validate JWT from cookie
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    // Step 2: Re-check DB — catches suspended accounts and deleted users
    const dbUser = await findUserById(sessionUser.id);

    if (!dbUser || dbUser.suspended) {
      // Clear the cookie so the client doesn't keep retrying
      await clearSessionCookie();
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: sessionUser });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null });
  }
}
