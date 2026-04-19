// ─── Threshold alert emails for paid-tool caps ─────────────────────────────
//
// Called fire-and-forget from paid-tool route handlers AFTER the run is logged.
// Idempotency is enforced by claimAlertSlot (atomic INSERT ... ON CONFLICT on
// paid_tool_alerts), so it is safe to call on every run at or above the
// thresholds — repeat calls are cheap no-ops.
//
// Thresholds (locked in cap-enforcement-spec.md):
//   75% → user email (cap-enforcement-copy.md §2). Single variant as of
//         S195-Copy (collapsed from the S194 user_75 / pace_exceeded_75
//         split; see §2 "Collapse note" in the copy spec).
//   80% → Calvin operational alert (cap-enforcement-copy.md §3).
//
// Window (S194): the user's current Stripe subscription period. Bounds are
// passed in by the caller (route handlers read them from
// getCurrentSubscriptionPeriod before calling here). Idempotency bucket is
// `[user_id]:[period_start_YYYY-MM-DD]` via claimAlertSlot.
//
// All copy strings mirror cap-enforcement-copy.md §2 and §3 verbatim.
// Do not reword here; update the spec first and propagate.
//
// Identity (locked S195-Copy):
//   §2 — From `Christian Murphy <results@promptaiagents.com>` with reply-to
//        `christian@promptaiagents.com`. The reply IS the CTA, so the
//        founder inbox lives on this surface. Do NOT apply this pairing
//        to any other email surface (see email taxonomy table in the
//        copy spec).
//   §3 — Internal machine-plain to calvin@promptaiagents.com. Not
//        user-visible; no founder voice or branded template.

import {
  claimAlertSlot,
  findUserById,
  type PaidToolName,
  type SubscriptionPeriod,
} from "@/lib/db";

// ─── Constants ──────────────────────────────────────────────────────────────

const RESEND_API = "https://api.resend.com";
const CALVIN_OPS_EMAIL = "calvin@promptaiagents.com";
const CHRISTIAN_FOUNDER_EMAIL = "christian@promptaiagents.com";

// ─── Per-tool copy fragments ────────────────────────────────────────────────
//
// The Workflow / Company / SWOT variants are locked in cap-enforcement-copy.md
// §2 and §3. Competitor and Search are pre-launch; their entries mirror the
// structure so the module stays exhaustive over PaidToolName without a type cast.
//
// Simplified S195-Copy (§2B retirement): the prose body is now uniform across
// tools, so only the tool identifiers (label / shortLabel / unitPlural) vary.
// Per-tool prose fields (userEmailMiddle / userEmailExtra / overage pricing /
// pace-exceeded rationale) are gone with §2B.

interface ToolCopy {
  /** Display name, e.g. "AGENT: Workflow". */
  label: string;
  /** Short name for subject lines, email prose, and Calvin alert body, e.g. "Workflow". */
  shortLabel: string;
  /** Plural deliverable noun, e.g. "workflows" | "dossiers" | "SWOTs". */
  unitPlural: string;
}

const TOOL_COPY: Record<PaidToolName, ToolCopy> = {
  workflow: {
    label: "AGENT: Workflow",
    shortLabel: "Workflow",
    unitPlural: "workflows",
  },
  company: {
    label: "AGENT: Company",
    shortLabel: "Company",
    unitPlural: "dossiers",
  },
  swot: {
    label: "AGENT: SWOT",
    shortLabel: "SWOT",
    unitPlural: "SWOTs",
  },
  // Competitor and Search: pre-launch placeholders. Update these entries when
  // each tool locks its copy in cap-enforcement-copy.md.
  competitor: {
    label: "AGENT: Competitor",
    shortLabel: "Competitor",
    unitPlural: "competitor reports",
  },
  search: {
    label: "AGENT: Search",
    shortLabel: "Search",
    unitPlural: "searches",
  },
};

// ─── Date formatting helper ─────────────────────────────────────────────────

/**
 * Format a Date as "November 1, 2027" (en-US full month, day, year, no ordinal).
 * Per cap-enforcement-copy.md §1, §2, §3 rules.
 */
function formatRenewalDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── HTML escape helper ─────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Resend send ────────────────────────────────────────────────────────────

/**
 * POST to Resend. Fails silently — never throws. Dev/mock mode: if
 * RESEND_API_KEY is missing or placeholder, log and skip.
 *
 * The §2 founder-voice email needs a different from-name (`Christian Murphy`)
 * and reply-to (`christian@`) than the brand transactional defaults, so the
 * send helper takes both explicitly instead of hard-coding a sender.
 */
async function sendEmail(
  to: string,
  from: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_placeholder" || apiKey === "paste_your_resend_api_key_here") {
    console.log(`[alerts] DEV mode: would have sent "${subject}" to ${to}`);
    return;
  }

  const payload: Record<string, unknown> = {
    from,
    to,
    subject,
    html,
  };
  if (replyTo) payload.reply_to = replyTo;

  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[alerts] Resend error (subject="${subject}"):`, err);
    }
  } catch (err) {
    console.error(`[alerts] Resend send failed (subject="${subject}"):`, err);
  }
}

// ─── §2 user 75% email ──────────────────────────────────────────────────────
//
// Custom founder-voice template. Deliberately does NOT use the shared
// buildBaseEmailHTML helper because §2 needs:
//   - Different from-name (Christian Murphy, not "Prompt AI Agents")
//   - Different reply-to (christian@, because the reply IS the CTA)
//   - No "Built for real jobs. Not demos." footer (that's the brand
//     transactional surface, not the founder surface)
//   - No top-of-email eyebrow tag
//   - Inter + DM Serif Display font stack site-consistent (S195-Copy
//     "scary monospace" critique fix)
//
// Body follows cap-enforcement-copy.md §2 verbatim. Do NOT reword here.

function buildUser75EmailHTML(
  toolLabel: string,
  toolShort: string,
  unitPlural: string,
  count: number,
  cap: number,
  renewalDate: string
): string {
  const remaining = Math.max(cap - count, 0);
  const preHeader = `You're at ${count} of ${cap} for this period.`;

  // Body prose mirrors spec §2 verbatim. Parallel phrasing across Workflow,
  // Company, SWOT — only the toolShort and unitPlural change.
  const sentence1 = `Thank you for using Prompt AI Agents.`;
  const sentence2 = `I'm glad ${escapeHtml(toolShort)} is earning its place in how you work.`;
  const sentence3 = `You've currently generated ${count} ${escapeHtml(unitPlural)} this period, which means you have ${remaining} left before your plan resets on <strong>${escapeHtml(renewalDate)}</strong>.`;
  const ladder1 = `No action needed today. If you'd like to renew early for a fresh period, reply here and I'll set it up.`;
  const ladder2 = `If you're interested in building beyond ${escapeHtml(toolShort)}, I run live one-on-one AI coaching, or Custom engagement if your team needs more.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ${escapeHtml(toolLabel)} pace this period</title>
</head>
<body style="margin:0; padding:0; background:#f0f0ee; font-family:-apple-system,BlinkMacSystemFont,'Inter','Helvetica Neue',Arial,sans-serif; -webkit-font-smoothing:antialiased; color:#161618;">

  <!-- Pre-header: controls inbox preview text -->
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${escapeHtml(preHeader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ee; padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Hero card -->
          <tr>
            <td style="background:#ffffff; border:1px solid #e4e4e2; border-radius:16px; padding:40px;">

              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 18px;">
                Hi,
              </p>

              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 18px;">
                ${sentence1} ${sentence2} ${sentence3}
              </p>

              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 18px;">
                ${ladder1}
              </p>

              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 24px;">
                ${ladder2}
              </p>

              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 4px;">
                Best,
              </p>
              <p style="font-size:16px; line-height:1.7; color:#161618; margin:0 0 24px;">
                Christian
              </p>

              <p style="font-size:14px; line-height:1.6; color:#555553; margin:0;">
                Christian Murphy<br/>
                Founder, Prompt AI Agents<br/>
                <a href="mailto:${CHRISTIAN_FOUNDER_EMAIL}" style="color:#555553; text-decoration:none;">${CHRISTIAN_FOUNDER_EMAIL}</a>
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

async function sendUser75Email(
  userEmail: string,
  toolName: PaidToolName,
  count: number,
  cap: number,
  period: SubscriptionPeriod
): Promise<void> {
  const copy = TOOL_COPY[toolName];
  const renewalDate = formatRenewalDate(period.end);

  const subject = `Your ${copy.label} pace this period`;
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "results@promptaiagents.com";
  const from = `Christian Murphy <${fromAddress}>`;

  const html = buildUser75EmailHTML(
    copy.label,
    copy.shortLabel,
    copy.unitPlural,
    count,
    cap,
    renewalDate
  );

  await sendEmail(userEmail, from, subject, html, CHRISTIAN_FOUNDER_EMAIL);
}

// ─── §3 Calvin 80% operational alert email ──────────────────────────────────
//
// Machine-plain body. Routes to calvin@promptaiagents.com (Calvin's private
// ops inbox, NOT the customer-facing christian@ address). Single §2 variant
// post-S195-Copy collapse, so the body line confirms "yes (§2)" rather than
// echoing which variant fired.

async function sendCalvin80Email(
  userId: string,
  userEmail: string,
  toolName: PaidToolName,
  count: number,
  cap: number,
  period: SubscriptionPeriod
): Promise<void> {
  const dbUser = await findUserById(userId);
  const firstName = dbUser?.first_name ?? null;
  const jobTitle = dbUser?.job_title ?? null;

  const copy = TOOL_COPY[toolName];
  const periodStartFmt = formatRenewalDate(period.start);
  const periodEndFmt = formatRenewalDate(period.end);
  const pct = Math.round((count / cap) * 100);

  // Profile line: first_name + job_title when both present; either alone when
  // only one present; entirely omitted when both NULL. Per cap-enforcement-copy.md §3.
  let profileLine: string | null = null;
  if (firstName && jobTitle) {
    profileLine = `Profile: ${firstName}, ${jobTitle}`;
  } else if (firstName) {
    profileLine = `Profile: ${firstName}`;
  } else if (jobTitle) {
    profileLine = `Profile: ${jobTitle}`;
  }

  const subject = `[PAA alert] ${userEmail} at ${pct}% of cap on ${copy.label}`;

  const lines: string[] = [
    `${userEmail} has used ${count} of ${cap} ${copy.shortLabel} runs this subscription period on their annual subscription.`,
    "",
    ...(profileLine ? [profileLine] : []),
    `Period started: ${periodStartFmt}`,
    `Period ends: ${periodEndFmt}`,
    `75% email sent: yes (§2)`,
    "Admin dashboard: https://promptaiagents.com/admin/usage",
    "",
    `No action required unless the pattern looks abusive. The user has received the §2 renew / coaching / Custom ladder and a reply may be inbound at ${CHRISTIAN_FOUNDER_EMAIL}.`,
  ];

  // Internal ops surface. Inter for legibility; no branded template,
  // no founder voice. Light-background plain so Gmail inbox renders clean.
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /></head>
<body style="margin:0; padding:24px; background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Inter','Helvetica Neue',Arial,sans-serif; color:#161618;">
${lines
  .map((line) =>
    line === ""
      ? `<div style="height:12px;"></div>`
      : `<p style="margin:0 0 6px 0; font-size:14px; line-height:1.55;">${escapeHtml(line)}</p>`
  )
  .join("\n")}
</body></html>`;

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "results@promptaiagents.com";
  const from = `Prompt AI Agents <${fromAddress}>`;

  await sendEmail(CALVIN_OPS_EMAIL, from, subject, html);
}

// ─── Public entry point ─────────────────────────────────────────────────────

/**
 * Fire threshold alerts if this run crossed 75% or 80% of the annual cap for
 * the user's current subscription period. Safe to call fire-and-forget:
 * catches its own errors, never throws.
 *
 * 75% behavior is single-variant post-S195-Copy (§2B retired). Every user
 * who crosses 75% on any paid tool receives the same §2 template. At 80%
 * the internal §3 alert fires to Calvin.
 *
 * Idempotency: claimAlertSlot buckets by `[user_id]:[period_start_YYYY-MM-DD]`,
 * so each subscription period gets a fresh slot set. Repeat calls within the
 * same period are cheap no-ops.
 *
 * @param runCountAfterThisRun  The count including this just-completed run.
 *                               Call with `runCount + 1` where `runCount` is
 *                               the pre-log value returned by
 *                               getCurrentPeriodRunCount.
 * @param annualCap             The per-period cap for this tool (100 Workflow,
 *                               150 Company, 40 SWOT at launch).
 * @param period                The user's current Stripe subscription period
 *                               bounds, read upstream by
 *                               getCurrentSubscriptionPeriod.
 */
export async function checkAndFireThresholdAlerts(
  userId: string,
  userEmail: string,
  toolName: PaidToolName,
  runCountAfterThisRun: number,
  annualCap: number,
  period: SubscriptionPeriod
): Promise<void> {
  try {
    const pct = runCountAfterThisRun / annualCap;

    // Below 75% → nothing to do.
    if (pct < 0.75) return;

    // 75% user email. Idempotent via claimAlertSlot scoped to this period.
    if (pct >= 0.75) {
      const claimed = await claimAlertSlot(
        userId,
        toolName,
        "user_75",
        period.start
      );
      if (claimed) {
        await sendUser75Email(
          userEmail,
          toolName,
          runCountAfterThisRun,
          annualCap,
          period
        );
      }
    }

    // 80% Calvin email. Idempotent via claimAlertSlot. Fires in addition to,
    // not in place of, the user email. Edge case (burst through 75% and 80%
    // in the same request) is handled naturally: both claims succeed on this
    // call and both emails send.
    if (pct >= 0.80) {
      const claimed = await claimAlertSlot(
        userId,
        toolName,
        "calvin_80",
        period.start
      );
      if (claimed) {
        await sendCalvin80Email(
          userId,
          userEmail,
          toolName,
          runCountAfterThisRun,
          annualCap,
          period
        );
      }
    }
  } catch (err) {
    console.error("[checkAndFireThresholdAlerts] failed:", err);
  }
}
