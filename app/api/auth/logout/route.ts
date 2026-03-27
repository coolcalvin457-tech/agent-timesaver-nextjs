// ─── POST /api/auth/logout ───────────────────────────────────────────────────
//
// Clears the JWT session cookie. Returns { success: true }.

import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearSessionCookie();

    // Also clear the client-readable name cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("paa_name", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Auth logout error:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
