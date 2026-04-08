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
   * e.g. "AGENT: Prompts"
   */
  eyebrowLabel: string;
  /**
   * Tool-specific HTML that goes inside the white hero card.
   * Everything between the hero <td> opening and closing tags.
   */
  heroContent: string;
}

// ─── Cross-sell block HTML helper (S118, F51-F53) ─────────────────────────────

interface CrossSellBlockHTMLOptions {
  /** Product name heading. e.g. "AGENT: Prompts" */
  productName: string;
  /**
   * Deliverables shown as a blue checkmark list, one item per line.
   * Mirrors the `checklistItems` prop on the React CrossSellBlock component.
   */
  checklistItems: string[];
  /** Button destination URL (absolute, e.g. "https://promptaiagents.com/prompts") */
  href: string;
  /**
   * Button label. Canonical platform-wide is "Try Now" (S111, F53 S118).
   * Defaults to "Try Now" — callers should omit this unless they have a
   * deliberate exception.
   */
  buttonLabel?: string;
}

/**
 * Builds the bottom-of-email cross-sell block HTML.
 *
 * Enforces the S118 Walkthrough 4 rules:
 *   - F51 — Checklist pattern (blue checkmark list, one deliverable per line)
 *   - F52 — "Built for real jobs. Not demos." is NOT rendered here
 *     (that line lives in the email footer only, via `buildBaseEmailHTML`)
 *   - F53 — Default button label is "Try Now"
 *   - Blue inline SVG checkmark, solid-fill brand-blue CTA (F45 cross-sell exception)
 *   - Reference treatment: AGENT: Prompts landing page "What's included" section
 *
 * This helper returns HTML that should be embedded inside the hero card `heroContent`
 * block, directly after the tool-specific results content.
 */
export function buildCrossSellBlockHTML({
  productName,
  checklistItems,
  href,
  buttonLabel = "Try Now",
}: CrossSellBlockHTMLOptions): string {
  const itemRows = checklistItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 0 0 10px 0;" valign="top">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="22" valign="middle" style="padding-right: 12px;">
                <!-- Blue checkmark icon -->
                <div style="width:20px; height:20px; border-radius:10px; background:#e8f1f8; text-align:center; line-height:20px;">
                  <span style="color:#1e7ab8; font-size:12px; font-weight:700; font-family:Arial,sans-serif;">✓</span>
                </div>
              </td>
              <td valign="middle" style="font-size:15px; color:#555553; line-height:1.5;">
                ${item}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  return `
    <!-- Cross-sell separator (S118, F51-F53) -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px; border-top:1px solid #e4e4e2;">
      <tr>
        <td style="padding: 32px 0 0 0;">
          <p style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600; letter-spacing:0.06em; color:#1e7ab8; text-transform:uppercase; margin:0 0 12px;">
            YOUR NEXT STEP
          </p>
          <h3 style="font-family:Georgia,serif; font-size:24px; font-weight:400; color:#161618; margin:0 0 20px; line-height:1.2;">
            ${productName}
          </h3>

          <!-- Checklist -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            ${itemRows}
          </table>

          <!-- CTA button -->
          <div style="text-align:center;">
            <a href="${href}" style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; padding:14px 28px; border-radius:10px; text-decoration:none;">
              ${buttonLabel}
            </a>
          </div>
        </td>
      </tr>
    </table>
  `;
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
              <p style="margin:0; font-family:monospace; font-size:13px; font-weight:600; letter-spacing:0.06em; color:#1e7ab8;">
                ${eyebrowLabel.toUpperCase()}
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
              <p style="margin:0 0 6px 0; font-size:13px; color:#888886; line-height:1.6;">
                You're receiving this because you used ${eyebrowLabel} at
                <a href="https://promptaiagents.com" style="color:#888886;">promptaiagents.com</a>.
              </p>
              <p style="margin:0; font-size:13px; color:#888886; line-height:1.6;">
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
