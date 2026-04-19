// ─── §6 Welcome email (S195-Copy) ──────────────────────────────────────────
//
// Founder-voice post-purchase welcome. Sent once per purchase across both
// trigger paths:
//
//   1. Annual subscription FIRST invoice
//      (Stripe webhook: invoice.payment_succeeded with billing_reason
//      "subscription_create"). Renewals do NOT re-send.
//
//   2. One-time purchase completion
//      (Stripe webhook: checkout.session.completed with mode "payment").
//
// Both triggers live in app/api/stripe/webhook/route.ts. This module
// owns the template + send + price_id→tool resolution. Wiring lives
// in the webhook.
//
// Spec: cap-enforcement-copy.md §6 (S195-Copy, April 18, 2026).
// Tone: Principle #9 — first-person that explains, never performs.
// Identity: Christian Murphy from-name + feedback@promptaiagents.com
// reply-to (Google Group forwarding to calvin@). NOT christian@ —
// that pairing is uniquely scoped to §2.
//
// All copy strings below are the locked spec strings. Do not edit
// without re-reading cap-enforcement-copy.md §6 first.

const RESEND_API = "https://api.resend.com";

// ─── Tool catalog ───────────────────────────────────────────────────────────

export type WelcomeTool = "Workflow" | "Company" | "SWOT";

/**
 * Resolves a Stripe price ID to a welcome-email tool name.
 *
 * Returns null for any price that should NOT trigger a welcome email
 * (e.g. AGENT: Prompts $4.99, HR Package, unknown / unrecognized prices).
 *
 * Env vars are read at call-time so a missing var degrades gracefully
 * (the price simply won't match — no welcome sent — and the warning
 * is logged at the call site).
 */
export function priceIdToWelcomeTool(priceId: string): WelcomeTool | null {
  const map: Record<string, WelcomeTool> = {};

  const workflowOnetime = process.env.STRIPE_WORKFLOW_ONETIME_PRICE_ID;
  const workflowAnnual = process.env.STRIPE_WORKFLOW_ANNUAL_PRICE_ID;
  const companyOnetime = process.env.STRIPE_COMPANY_ONETIME_PRICE_ID;
  const companyAnnual = process.env.STRIPE_COMPANY_ANNUAL_PRICE_ID;
  const swotOnetime = process.env.STRIPE_SWOT_ONETIME_PRICE_ID;
  const swotAnnual = process.env.STRIPE_SWOT_ANNUAL_PRICE_ID;

  if (workflowOnetime) map[workflowOnetime] = "Workflow";
  if (workflowAnnual) map[workflowAnnual] = "Workflow";
  if (companyOnetime) map[companyOnetime] = "Company";
  if (companyAnnual) map[companyAnnual] = "Company";
  if (swotOnetime) map[swotOnetime] = "SWOT";
  if (swotAnnual) map[swotAnnual] = "SWOT";

  return map[priceId] ?? null;
}

// ─── Template ───────────────────────────────────────────────────────────────

/**
 * Builds the §6 welcome email HTML.
 *
 * Self-contained template. Deliberately does NOT use the shared
 * buildBaseEmailHTML helper because §6 needs:
 *   - Different from-name (Christian Murphy, not "Prompt AI Agents")
 *   - No "Built for real jobs. Not demos." footer
 *   - No top-of-email eyebrow tag
 *   - Founder-voice prose body, not card-and-results layout
 *
 * Font stack matches the site (Inter + DM Serif Display) per the
 * S195-Copy "scary monospace" critique fix. No monospace anywhere.
 */
function buildWelcomeEmailHTML(toolName: WelcomeTool): string {
  const preHeader = `AGENT: ${toolName} is ready whenever you are.`;

  // Body is exactly four sentences per spec rule. Parallel phrasing across
  // all three tools — only the tool name in sentences two and four changes.
  // The middle value-prop phrase ("making complex tasks feel easier")
  // stays identical across Workflow, Company, and SWOT.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to AGENT: ${toolName}</title>
</head>
<body style="margin:0; padding:0; background:#f0f0ee; font-family:-apple-system,BlinkMacSystemFont,'Inter','Helvetica Neue',Arial,sans-serif; -webkit-font-smoothing:antialiased; color:#161618;">

  <!-- Pre-header: controls inbox preview text -->
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${preHeader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ee; padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Hero card -->
          <tr>
            <td style="background:#ffffff; border:1px solid #e4e4e2; border-radius:16px; padding:40px;">

              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 18px;">
                Welcome,
              </p>

              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 18px;">
                Thank you for using Prompt AI Agents. I hope ${toolName} proves to be a valuable resource for making complex tasks feel easier. You can always reach out with feedback you'd like to share or if you need help with any one of our agent tools. In the meantime, enjoy using ${toolName}.
              </p>

              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 4px;">
                Best,
              </p>
              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 24px;">
                Christian
              </p>

              <p style="font-size:14px; line-height:1.6; color:#555553; margin:0;">
                Christian Murphy<br/>
                Founder<br/>
                Prompt AI Agents
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

/**
 * Plain-text fallback. Same four sentences and three-line signature
 * as the HTML version. Used for clients that strip HTML.
 */
function buildWelcomeEmailText(toolName: WelcomeTool): string {
  return `Welcome,

Thank you for using Prompt AI Agents. I hope ${toolName} proves to be a valuable resource for making complex tasks feel easier. You can always reach out with feedback you'd like to share or if you need help with any one of our agent tools. In the meantime, enjoy using ${toolName}.

Best,
Christian

Christian Murphy
Founder
Prompt AI Agents
`;
}

// ─── Send ───────────────────────────────────────────────────────────────────

interface SendResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/**
 * Sends the §6 welcome email via Resend.
 *
 * Identity (locked S195-Copy, April 18-19, 2026):
 *   From display name: "Christian Murphy"
 *   From address:      results@promptaiagents.com (transactional sender)
 *   Reply-to:          feedback@promptaiagents.com (Google Group →
 *                       forwards to calvin@promptaiagents.com)
 *
 * The hybrid pattern (personal from-name + dedicated feedback inbox)
 * is deliberate. christian@ stays scoped to §2 — see the email
 * taxonomy table at the top of cap-enforcement-copy.md.
 *
 * Returns a result object instead of throwing so callers (the Stripe
 * webhook) can log without aborting the rest of the handler. A failed
 * welcome email should never cause Stripe to retry the whole event.
 */
export async function sendWelcomeEmail(
  toolName: WelcomeTool,
  customerEmail: string
): Promise<SendResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "results@promptaiagents.com";
  const replyTo = process.env.RESEND_WELCOME_REPLY_TO ?? "feedback@promptaiagents.com";

  const payload = {
    from: `Christian Murphy <${fromAddress}>`,
    to: [customerEmail],
    reply_to: replyTo,
    subject: `Welcome to AGENT: ${toolName}`,
    html: buildWelcomeEmailHTML(toolName),
    text: buildWelcomeEmailText(toolName),
  };

  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        status: res.status,
        error: `Resend ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    return { ok: true, status: res.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown send error",
    };
  }
}
