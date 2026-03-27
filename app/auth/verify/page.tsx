// ─── /auth/verify ────────────────────────────────────────────────────────────
//
// Server-side page. User lands here from the magic link email.
// Verifies token, sets session cookie, redirects to homepage (or redirect param).
// If invalid/expired: shows error with link back to /login.

import { redirect } from "next/navigation";
import { hashToken } from "@/lib/db";
import {
  findMagicLinkByTokenHash,
  markMagicLinkUsed,
  findUserByEmail,
} from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

interface VerifyPageProps {
  searchParams: Promise<{ token?: string; redirect?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const rawToken = params.token;
  const redirectTo = params.redirect || "/";

  // No token provided
  if (!rawToken) {
    return <VerifyError message="No sign-in token found." />;
  }

  // Look up the hashed token
  const tokenHash = hashToken(rawToken);
  const magicLink = await findMagicLinkByTokenHash(tokenHash);

  // Token not found
  if (!magicLink) {
    return <VerifyError message="This sign-in link is invalid." />;
  }

  // Token already used
  if (magicLink.used) {
    return <VerifyError message="This sign-in link has already been used." />;
  }

  // Token expired
  if (new Date() > new Date(magicLink.expires_at)) {
    return <VerifyError message="This sign-in link has expired." />;
  }

  // Mark as used
  await markMagicLinkUsed(magicLink.id);

  // Find user
  const user = await findUserByEmail(magicLink.email);
  if (!user) {
    return <VerifyError message="Account not found. Please sign up again." />;
  }

  // Set session cookie
  await setSessionCookie({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    jobTitle: user.job_title ?? undefined,
  });

  // Redirect
  redirect(redirectTo);
}

// ─── Error display ───────────────────────────────────────────────────────────

function VerifyError({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-alt, #F8F8F6)",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "440px",
          width: "100%",
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E4E4E2)",
          borderRadius: "16px",
          padding: "48px 40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display, 'DM Serif Display', serif)",
            fontSize: "24px",
            fontWeight: 400,
            color: "var(--text-primary, #161618)",
            margin: "0 0 12px",
          }}
        >
          Link not valid
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "var(--text-secondary, #555553)",
            margin: "0 0 32px",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        <a
          href="/login"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "var(--dark, #161618)",
            color: "#FFFFFF",
            fontSize: "15px",
            fontWeight: 600,
            borderRadius: "8px",
            textDecoration: "none",
            letterSpacing: "0.01em",
          }}
        >
          Request a new link
        </a>
      </div>
    </div>
  );
}
