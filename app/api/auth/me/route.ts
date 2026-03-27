// ─── GET /api/auth/me ────────────────────────────────────────────────────────
//
// Reads JWT from cookie. Returns user data or { user: null }.
// Used by client components (AuthProvider) to check auth state.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user: user ?? null });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null });
  }
}
