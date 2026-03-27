// ─── POST /api/auth/login ────────────────────────────────────────────────────
//
// Accepts: { email, firstName?, jobTitle? }
// If email not in users: create user, then generate magic link.
// If email in users: generate magic link (ignore name/job title fields).
// Sends magic link email via Resend.
// Returns: { success: true, isNewUser: boolean }

import { NextResponse } from "next/server";
import {
  findUserByEmail,
  createUser,
  createMagicLink,
  generateToken,
  hashToken,
} from "@/lib/db";
import {
  RESEND_API,
  getFromAddress,
  buildBaseEmailHTML,
} from "@/app/api/_shared/emailBase";

// Rate limit: one magic link per email per 60 seconds (in-memory, resets on deploy)
const recentRequests = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim()?.toLowerCase();
    const firstName = body.firstName?.trim();
    const jobTitle = body.jobTitle?.trim() || undefined;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Rate limit: 60-second cooldown per email
    const lastRequest = recentRequests.get(email);
    if (lastRequest && Date.now() - lastRequest < 60_000) {
      return NextResponse.json(
        { error: "A sign-in link was just sent. Check your inbox or wait a moment to resend." },
        { status: 429 }
      );
    }

    // Check if user exists
    let user = await findUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      // New user: firstName is required
      if (!firstName) {
        return NextResponse.json(
          { error: "First name is required for new accounts." },
          { status: 400 }
        );
      }
      user = await createUser(email, firstName, jobTitle);
      isNewUser = true;
    }

    // Generate magic link
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await createMagicLink(email, tokenHash, expiresAt);

    // Build verify URL
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const verifyUrl = `${baseUrl}/auth/verify?token=${rawToken}`;

    // Send magic link email
    await sendMagicLinkEmail(email, user.first_name, verifyUrl);

    // Track rate limit
    recentRequests.set(email, Date.now());

    return NextResponse.json({ success: true, isNewUser });
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Magic link email ────────────────────────────────────────────────────────

async function sendMagicLinkEmail(
  email: string,
  firstName: string,
  verifyUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  // Dev/mock mode
  if (!apiKey || apiKey === "re_placeholder") {
    console.log(`[DEV] Magic link for ${email}: ${verifyUrl}`);
    return;
  }

  const heroContent = `
    <p style="margin:0 0 24px; font-size:16px; color:#161618; line-height:1.6;">
      Hi ${firstName},
    </p>
    <p style="margin:0 0 32px; font-size:16px; color:#161618; line-height:1.6;">
      Click the button below to sign in to Prompt AI Agents.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="background:#161618; border-radius:8px;">
          <a href="${verifyUrl}" style="display:inline-block; padding:14px 32px; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; letter-spacing:0.01em;">
            Sign In
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0; font-size:14px; color:#888886; line-height:1.6;">
      This link expires in 15 minutes. If you didn't request this, you can ignore this email.
    </p>
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: "Your sign-in link for Prompt AI Agents",
    eyebrowLabel: "PROMPT AI AGENTS",
    heroContent,
  });

  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: email,
      subject: "Your sign-in link for Prompt AI Agents",
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    throw new Error("Failed to send magic link email");
  }
}
