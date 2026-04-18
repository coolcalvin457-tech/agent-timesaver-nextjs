// ─── Threshold alert emails for paid-tool caps ─────────────────────────────
//
// Called fire-and-forget from paid-tool route handlers AFTER the run is logged.
// Idempotency is enforced by claimAlertSlot (atomic INSERT ... ON CONFLICT on
// paid_tool_alerts), so it is safe to call on every run at or above the
// thresholds — repeat calls are cheap no-ops.
//
// Thresholds (locked in cap-enforcement-spec.md):
//   75% → user email (from results@promptaiagents.com). One of two variants:
//           • "user_75" — standard "on pace" note (cap-enforcement-copy.md §2)
//           • "pace_exceeded_75" — overage + custom-plan offer (§2B), sent
//             when projected end-of-period usage > cap × 1.2.
//         Variant is resolved by pickUser75Variant at send time.
//   80% → Calvin operational alert (to calvin@promptaiagents.com, §3).
//
// Window (S194): the user's current Stripe subscription period. Bounds are
// passed in by the caller (route handlers read them from
// getCurrentSubscriptionPeriod before calling here). Idempotency bucket is
// `[user_id]:[period_start_YYYY-MM-DD]` via claimAlertSlot.
//
// All copy strings mirror cap-enforcement-copy.md §2, §2B, and §3 verbatim.
// Do not reword here; update the spec first and propagate.

import {
  claimAlertSlot,
  findUserById,
  type PaidToolName,
  type SubscriptionPeriod,
} from "@/lib/db";
import { RESEND_API, buildBaseEmailHTML, getFromAddress } from "@/app/api/_shared/emailBase";

// ─── Constants ──────────────────────────────────────────────────────────────

const CALVIN_EMAIL = "calvin@promptaiagents.com";
const CALVIN_SUPPORT_MAILTO = "calvin@promptaiagents.com";

// ─── Per-tool copy fragments ────────────────────────────────────────────────
//
// The Workflow / Company / SWOT variants are locked in cap-enforcement-copy.md
// §2 and §3. Competitor and Search are pre-launch; their entries mirror the
// structure so the module stays exhaustive over PaidToolName without a type cast.

interface ToolCopy {
  /** Display name, e.g. "AGENT: Workflow". */
  label: string;
  /** Short name for subject lines and plain-text Calvin body, e.g. "Workflow". */
  shortLabel: string;
  /** Plural deliverable noun, e.g. "workflows" | "dossiers" | "SWOTs". */
  unitPlural: string;
  /** Singular deliverable noun for §2B overage line, e.g. "workflow" | "dossier" | "SWOT". */
  unitSingular: string;
  /** Verb for the count sentence, e.g. "built" (for Workflow/Company/SWOT). */
  capCopyVerb: string;
  /** Second paragraph of the 75% user email (specific to each tool). */
  userEmailMiddle: string;
  /** Third paragraph of the 75% user email (specific to each tool). */
  userEmailExtra: string;
  /**
   * Per-unit overage pack price in whole dollars. Matches the tool's one-time
   * SKU ($49 Workflow, $29 Company, $99 SWOT). Used only in §2B copy.
   */
  paceExceededOveragePriceDollars: number;
  /**
   * Per-tool "custom plan" rationale sentence from §2B. Appears after the
   * "custom plan sized to your actual volume." line. Locked in
   * cap-enforcement-copy.md §2B.
   */
  paceExceededRationale: string;
}

const TOOL_COPY: Record<PaidToolName, ToolCopy> = {
  workflow: {
    label: "AGENT: Workflow",
    shortLabel: "Workflow",
    unitPlural: "workflows",
    unitSingular: "workflow",
    capCopyVerb: "built",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your next workflow with confidence.",
    userEmailExtra: `If you'd like to talk through a particularly complex workflow or use case, I'm happy to help: ${CALVIN_SUPPORT_MAILTO}.`,
    paceExceededOveragePriceDollars: 49,
    paceExceededRationale:
      "If Workflow is core to how you operate, I'd rather build something that fits than have you hit a cap in the middle of a good run.",
  },
  company: {
    label: "AGENT: Company",
    shortLabel: "Company",
    unitPlural: "dossiers",
    unitSingular: "dossier",
    capCopyVerb: "built",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your remaining dossiers this period.",
    userEmailExtra: `If you're working through a batch of targets and want to sequence them, I'm happy to help: ${CALVIN_SUPPORT_MAILTO}.`,
    paceExceededOveragePriceDollars: 29,
    paceExceededRationale:
      "If Company is core to your sales, recruiting, or research work, I'd rather build something that fits than have you hit a cap in the middle of an active pipeline.",
  },
  swot: {
    label: "AGENT: SWOT",
    shortLabel: "SWOT",
    unitPlural: "SWOTs",
    unitSingular: "SWOT",
    capCopyVerb: "built",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your next SWOT with confidence.",
    userEmailExtra: `If you have a large slate of SWOTs coming and want help sequencing them, reach out: ${CALVIN_SUPPORT_MAILTO}.`,
    paceExceededOveragePriceDollars: 99,
    paceExceededRationale:
      "If SWOT is part of your diligence cadence, I'd rather build something that fits than have you hit a cap before you're through your slate.",
  },
  // Competitor and Search: pre-launch placeholders. Update these entries when
  // each tool locks its copy in cap-enforcement-copy.md.
  competitor: {
    label: "AGENT: Competitor",
    shortLabel: "Competitor",
    unitPlural: "competitor reports",
    unitSingular: "competitor report",
    capCopyVerb: "built",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your remaining reports this period.",
    userEmailExtra: `If you have questions, reach out: ${CALVIN_SUPPORT_MAILTO}.`,
    paceExceededOveragePriceDollars: 0,
    paceExceededRationale:
      "If Competitor is core to how you operate, I'd rather build something that fits than have you hit a cap in the middle of a good run.",
  },
  search: {
    label: "AGENT: Search",
    shortLabel: "Search",
    unitPlural: "searches",
    unitSingular: "search",
    capCopyVerb: "run",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your remaining searches this period.",
    userEmailExtra: `If you have questions, reach out: ${CALVIN_SUPPORT_MAILTO}.`,
    paceExceededOveragePriceDollars: 0,
    paceExceededRationale:
      "If Search is core to how you operate, I'd rather build something that fits than have you hit a cap in the middle of a good run.",
  },
};

// ─── Date formatting helper ─────────────────────────────────────────────────

/**
 * Format a Date as "November 1, 2027" (en-US full month, day, year, no ordinal).
 * Per cap-enforcement-copy.md §1, §2, §2B, §3 rules.
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
 * POST to Resend. Matches the fetch pattern used elsewhere in the codebase
 * (auth/login, prompt-kit-email, etc.). Fails silently — never throws.
 * Dev/mock mode: if RESEND_API_KEY is missing or placeholder, log and skip.
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  fromOverride?: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_placeholder" || apiKey === "paste_your_resend_api_key_here") {
    console.log(`[alerts] DEV mode: would have sent "${subject}" to ${to}`);
    return;
  }

  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromOverride ?? getFromAddress(),
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[alerts] Resend error (subject="${subject}"):`, err);
    }
  } catch (err) {
    console.error(`[alerts] Resend send failed (subject="${subject}"):`, err);
  }
}

// ─── User 75% "on pace" email (standard variant, §2) ────────────────────────

async function sendUser75Email(
  userId: string,
  userEmail: string,
  toolName: PaidToolName,
  count: number,
  cap: number,
  period: SubscriptionPeriod
): Promise<void> {
  const dbUser = await findUserById(userId);
  const firstName = dbUser?.first_name ?? "there";

  const copy = TOOL_COPY[toolName];
  const renewalDate = formatRenewalDate(period.end);

  const subject = `You're on pace with ${copy.label} this period`;

  // Body prose (mirrors cap-enforcement-copy.md §2 verbatim)
  const paragraph1 = `Hi ${escapeHtml(firstName)},`;
  const paragraph2 = `You've ${copy.capCopyVerb} ${count} ${copy.unitPlural} this subscription period with ${copy.label}. Your annual plan covers up to ${cap} per period, and your allowance refreshes when your subscription renews on <strong>${escapeHtml(renewalDate)}</strong>.`;
  const paragraph3 = copy.userEmailMiddle;
  const paragraph4 = copy.userEmailExtra.replace(
    CALVIN_SUPPORT_MAILTO,
    `<a href="mailto:${CALVIN_SUPPORT_MAILTO}" style="color:#1e7ab8; text-decoration:none;">${CALVIN_SUPPORT_MAILTO}</a>`
  );
  const paragraph5 = `Calvin<br/>Prompt AI Agents`;

  const heroContent = [paragraph1, paragraph2, paragraph3, paragraph4, paragraph5]
    .map(
      (p, i) =>
        `<p style="margin:0 0 ${i === 4 ? "0" : "20px"}; font-size:16px; color:#161618; line-height:1.6;">${p}</p>`
    )
    .join("");

  const html = buildBaseEmailHTML({
    preHeaderText: `You've ${copy.capCopyVerb} ${count} of ${cap} ${copy.unitPlural} this period`,
    eyebrowLabel: copy.label,
    heroContent,
  });

  await sendEmail(userEmail, subject, html);
}

// ─── User 75% pace-exceeded email (§2B) ─────────────────────────────────────

async function sendPaceExceededEmail(
  userId: string,
  userEmail: string,
  toolName: PaidToolName,
  count: number,
  cap: number,
  period: SubscriptionPeriod
): Promise<void> {
  const dbUser = await findUserById(userId);
  const firstName = dbUser?.first_name ?? "there";

  const copy = TOOL_COPY[toolName];
  const renewalDate = formatRenewalDate(period.end);
  const overagePrice = copy.paceExceededOveragePriceDollars;

  const subject = `Your ${copy.label} usage this period`;

  // Body prose (mirrors cap-enforcement-copy.md §2B verbatim)
  const paragraph1 = `Hi ${escapeHtml(firstName)},`;
  const paragraph2 = `You've ${copy.capCopyVerb} ${count} ${copy.unitPlural} this subscription period with ${copy.label}. At your current pace, you're on track to use more than the ${cap} your annual plan covers.`;
  const paragraph3 = `Two quick options if you need additional volume this period:`;
  const paragraph4 = `An overage pack at $${overagePrice} per additional ${copy.unitSingular}, added to your account. Same-day setup, no plan change.`;
  const paragraph5 = `Or a custom plan sized to your actual volume. ${copy.paceExceededRationale}`;
  const paragraph6 = `If ${cap} is enough for your period, no action needed. Your allowance refreshes when your subscription renews on <strong>${escapeHtml(renewalDate)}</strong>, and you'll get one more note before you hit the cap.`;
  const paragraph7 = `Easiest path either way is to reply here, or email me at <a href="mailto:${CALVIN_SUPPORT_MAILTO}" style="color:#1e7ab8; text-decoration:none;">${CALVIN_SUPPORT_MAILTO}</a>.`;
  const paragraph8 = `Calvin<br/>Prompt AI Agents`;

  const paragraphs = [
    paragraph1,
    paragraph2,
    paragraph3,
    paragraph4,
    paragraph5,
    paragraph6,
    paragraph7,
    paragraph8,
  ];
  const heroContent = paragraphs
    .map(
      (p, i) =>
        `<p style="margin:0 0 ${i === paragraphs.length - 1 ? "0" : "20px"}; font-size:16px; color:#161618; line-height:1.6;">${p}</p>`
    )
    .join("");

  const html = buildBaseEmailHTML({
    preHeaderText: `You've ${copy.capCopyVerb} ${count} of ${cap} ${copy.unitPlural} this period. Options inside.`,
    eyebrowLabel: copy.label,
    heroContent,
  });

  await sendEmail(userEmail, subject, html);
}

// ─── Calvin 80% operational alert email (§3) ────────────────────────────────

async function sendCalvin80Email(
  userId: string,
  userEmail: string,
  toolName: PaidToolName,
  count: number,
  cap: number,
  period: SubscriptionPeriod,
  userVariantSent: "user_75" | "pace_exceeded_75"
): Promise<void> {
  const dbUser = await findUserById(userId);
  const firstName = dbUser?.first_name ?? null;
  const jobTitle = dbUser?.job_title ?? null;

  const copy = TOOL_COPY[toolName];
  const periodStartFmt = formatRenewalDate(period.start);
  const periodEndFmt = formatRenewalDate(period.end);

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

  const subject = `[PAA alert] ${userEmail} approaching cap on AGENT: ${copy.shortLabel}`;

  // Trailing action-required sentence per §3: differs based on which user
  // variant was sent. pace_exceeded_75 means a reply from the user may be
  // inbound and Calvin should prioritize that inbox.
  const trailingSentence =
    userVariantSent === "pace_exceeded_75"
      ? "No action required unless pattern looks abusive, or unless the user email variant was pace_exceeded_75 (in which case a reply to Calvin's escape-hatch offer may be inbound)."
      : 'The user has been sent the standard "on pace" email. No action required unless pattern looks abusive.';

  // Machine-plain body (not branded). Uses monospace for scannability.
  const lines: string[] = [
    `${userEmail} has used ${count} of ${cap} ${copy.shortLabel} runs this subscription period on their annual subscription.`,
    "",
    ...(profileLine ? [profileLine] : []),
    `Period started: ${periodStartFmt}`,
    `Period ends: ${periodEndFmt}`,
    `User email variant sent: ${userVariantSent}`,
    "Admin dashboard: https://promptaiagents.com/admin/usage",
    "",
    trailingSentence,
  ];

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /></head>
<body style="margin:0; padding:24px; background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
${lines
  .map((line) =>
    line === ""
      ? `<div style="height:12px;"></div>`
      : `<p style="margin:0 0 6px 0; font-family:monospace; font-size:14px; color:#161618; line-height:1.5;">${escapeHtml(line)}</p>`
  )
  .join("\n")}
</body></html>`;

  await sendEmail(CALVIN_EMAIL, subject, html);
}

// ─── pickUser75Variant resolver ─────────────────────────────────────────────

/**
 * Decide between the standard §2 "on pace" email and the §2B pace-exceeded
 * overage/custom-plan email at 75% crossing.
 *
 * Logic (locked in cap-enforcement-spec.md):
 *   projected end-of-period usage = (runCount / elapsedMillis) × periodMillis
 *   if projected > cap × 1.2 → "pace_exceeded_75"
 *   else                     → "user_75"
 *
 * Defensive fall-through: if the period is degenerate (end <= start, or now
 * <= start due to clock skew), return the standard variant. Better to
 * under-escalate than over-escalate on bad data.
 */
export function pickUser75Variant(
  runCount: number,
  cap: number,
  periodStart: Date,
  periodEnd: Date,
  now: Date = new Date()
): "user_75" | "pace_exceeded_75" {
  const PACE_MULTIPLIER = 1.2;
  const periodMillis = periodEnd.getTime() - periodStart.getTime();
  const elapsedMillis = now.getTime() - periodStart.getTime();
  if (periodMillis <= 0 || elapsedMillis <= 0) return "user_75";
  const projectedCount = (runCount / elapsedMillis) * periodMillis;
  return projectedCount > cap * PACE_MULTIPLIER ? "pace_exceeded_75" : "user_75";
}

// ─── Public entry point ─────────────────────────────────────────────────────

/**
 * Fire threshold alerts if this run crossed 75% or 80% of the annual cap for
 * the user's current subscription period. Safe to call fire-and-forget:
 * catches its own errors, never throws.
 *
 * 75% behavior is variant-aware: at the 75% crossing we resolve between the
 * standard §2 "on pace" variant and the §2B pace-exceeded variant via
 * pickUser75Variant. We claim the slot that matches the resolved variant
 * only (`user_75` OR `pace_exceeded_75`, never both). At 80% the Calvin alert
 * fires and echoes which user variant was sent.
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

    // Resolve the user variant once, up front. Both the 75% user email and
    // the 80% Calvin email need to know which variant was (or would have been)
    // chosen; the 80% email echoes it as `user_email_variant`.
    const userVariant = pickUser75Variant(
      runCountAfterThisRun,
      annualCap,
      period.start,
      period.end
    );

    // 75% user email. Idempotent via claimAlertSlot scoped to this period.
    // Claim the slot matching the resolved variant; if it's already claimed
    // this period, the INSERT is a no-op and we skip the send. We never claim
    // both `user_75` and `pace_exceeded_75` in the same period — whichever
    // variant the first crossing resolved to wins for the rest of the period.
    if (pct >= 0.75) {
      const claimed = await claimAlertSlot(
        userId,
        toolName,
        userVariant,
        period.start
      );
      if (claimed) {
        if (userVariant === "pace_exceeded_75") {
          await sendPaceExceededEmail(
            userId,
            userEmail,
            toolName,
            runCountAfterThisRun,
            annualCap,
            period
          );
        } else {
          await sendUser75Email(
            userId,
            userEmail,
            toolName,
            runCountAfterThisRun,
            annualCap,
            period
          );
        }
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
          period,
          userVariant
        );
      }
    }
  } catch (err) {
    console.error("[checkAndFireThresholdAlerts] failed:", err);
  }
}
