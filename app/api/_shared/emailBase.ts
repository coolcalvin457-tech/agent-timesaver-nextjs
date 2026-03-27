// ─── Shared email utilities ───────────────────────────────────────────────────
//
// Used by all tool email routes: prompt-kit-email, onboarding-kit-email,
// pip-builder-email, budget-spreadsheet-email.
//
// When adding a new tool email route, import from here — never duplicate these.

// ─── Constants ────────────────────────────────────────────────────────────────

export const RESEND_API = "https://api.resend.com";

// ─── Sender address ───────────────────────────────────────────────────────────

/** Returns the "From" header string using the RESEND_FROM_EMAIL env var. */
export function getFromAddress(): string {
  return `Prompt AI Agents <${process.env.RESEND_FROM_EMAIL ?? "results@promptaiagents.com"}>`;
}

// ─── Audience helper ──────────────────────────────────────────────────────────

/**
 * Adds an email address to the Resend audience list (for newsletter/broadcast).
 * Fails silently if RESEND_AUDIENCE_ID is not configured.
 */
export async function addContactToAudience(email: string): Promise<void> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) return;

  await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });
}

// ─── HTML base template ───────────────────────────────────────────────────────

interface BaseEmailOptions {
  /**
   * Short preview text shown in Gmail/Outlook inbox before the email is opened.
   * Should be 90 characters or fewer. No period at the end.
   */
  preHeaderText: string;
  /**
   * Monospace eyebrow label shown at the top of the email and in the footer.
   * e.g. "AGENT: Prompt Builder"
   */
  eyebrowLabel: string;
  /**
   * Tool-specific HTML that goes inside the white hero card.
   * Everything between the hero <td> opening and closing tags.
   */
  heroContent: string;
}

/**
 * Builds the full HTML email string.
 *
 * Enforces:
 *   - Hidden pre-header span with &nbsp;&zwnj; padding
 *   - Consistent outer wrapper, background color (#f0f0ee), and font stack
 *   - Monospace eyebrow header at the top
 *   - White hero card (16px border-radius, 40px padding)
 *   - "Built for real jobs. Not demos." in the footer
 */
export function buildBaseEmailHTML({
  preHeaderText,
  eyebrowLabel,
  heroContent,
}: BaseEmailOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${eyebrowLabel}</title>
</head>
<body style="margin:0; padding:0; background:#f0f0ee; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; -webkit-font-smoothing:antialiased;">

  <!-- Pre-header: controls inbox preview text -->
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${preHeaderText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ee; padding: 48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <p style="margin:0; font-family:monospace; font-size:13px; font-weight:600; letter-spacing:0.06em; color:#16425b;">
                ${eyebrowLabel}
              </p>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#ffffff; border:1px solid #e4e4e2; border-radius:16px; padding:40px;">
              ${heroContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0;">
              <p style="margin:0; font-size:13px; color:#888886; line-height:1.6;">
                You're receiving this because you used ${eyebrowLabel} at
                <a href="https://promptaiagents.com" style="color:#888886;">promptaiagents.com</a>.
                Built for real jobs. Not demos.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
