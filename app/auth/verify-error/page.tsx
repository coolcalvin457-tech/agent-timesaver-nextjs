// ─── /auth/verify-error ──────────────────────────────────────────────────────
//
// Error display for magic link verification failures.
// The actual verify logic lives in /api/auth/verify (Route Handler).
// This page just shows the user-friendly error message.

interface VerifyErrorPageProps {
  searchParams: Promise<{ message?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  "no-token": "No sign-in token found.",
  invalid: "This sign-in link is invalid.",
  used: "This sign-in link has already been used.",
  expired: "This sign-in link has expired.",
  "no-account": "Account not found. Please sign up again.",
  error: "Something went wrong. Please try again.",
};

export default async function VerifyErrorPage({
  searchParams,
}: VerifyErrorPageProps) {
  const params = await searchParams;
  const message =
    ERROR_MESSAGES[params.message || ""] || ERROR_MESSAGES.error;

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
