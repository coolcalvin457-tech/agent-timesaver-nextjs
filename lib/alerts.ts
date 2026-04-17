// ─── Threshold alert emails for paid-tool caps ─────────────────────────────
//
// Called fire-and-forget from paid-tool route handlers AFTER the run is logged.
// Idempotency is enforced by claimAlertSlot (atomic INSERT ... ON CONFLICT on
// paid_tool_alerts), so it is safe to call on every run at or above the
// thresholds — repeat calls are cheap no-ops.
//
// Thresholds (locked in cap-enforcement-spec.md):
//   75% → user "on pace" email (from results@promptaiagents.com)
//   80% → Calvin operational alert (to calvin@promptaiagents.com)
//
// All copy strings mirror cap-enforcement-copy.md §2 and §3 verbatim. Do not
// reword here; update the spec first and propagate.

import {
  claimAlertSlot,
  findUserById,
  type PaidToolName,
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
  /** Verb for the count sentence, e.g. "built" (for Workflow/Company/SWOT). */
  capCopyVerb: string;
  /** Second paragraph of the 75% user email (specific to each tool). */
  userEmailMiddle: string;
  /** Third paragraph of the 75% user email (specific to each tool). */
  userEmailExtra: string;
}

const TOOL_COPY: Record<PaidToolName, ToolCopy> = {
  workflow: {
    label: "AGENT: Workflow",
    shortLabel: "Workflow",
    unitPlural: "workflows",
    capCopyVerb: "built",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your next workflow with confidence.",
    userEmailExtra: `If you'd like to talk through a particularly complex workflow or use case, I'm happy to help: ${CALVIN_SUPPORT_MAILTO}.`,
  },
  company: {
    label: "AGENT: Company",
    shortLabel: "Company",
    unitPlural: "dossiers",
    capCopyVerb: "built",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your remaining dossiers this year.",
    userEmailExtra: `If you're working through a batch of targets and want to sequence them, I'm happy to help: ${CALVIN_SUPPORT_MAILTO}.`,
  },
  swot: {
    label: "AGENT: SWOT",
    shortLabel: "SWOT",
    unitPlural: "SWOTs",
    capCopyVerb: "built",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your next SWOT with confidence.",
    userEmailExtra: `If you have a large slate of SWOTs coming and want help sequencing them, reach out: ${CALVIN_SUPPORT_MAILTO}.`,
  },
  // Competitor and Search: pre-launch placeholders. Update these entries when
  // each tool locks its copy in cap-enforcement-copy.md.
  competitor: {
    label: "AGENT: Competitor",
    shortLabel: "Competitor",
    unitPlural: "competitor reports",
    capCopyVerb: "built",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your remaining reports this year.",
    userEmailExtra: `If you have questions, reach out: ${CALVIN_SUPPORT_MAILTO}.`,
  },
  search: {
    label: "AGENT: Search",
    shortLabel: "Search",
    unitPlural: "searches",
    capCopyVerb: "run",
    userEmailMiddle:
      "No action needed. This email is a friendly heads-up so you can plan your remaining searches this year.",
    userEmailExtra: `If you have questions, reach out: ${CALVIN_SUPPORT_MAILTO}.`,
  },
};

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

// ─── User 75% "on pace" email ───────────────────────────────────────────────

async function sendUser75Email(
  userId: string,
  userEmail: string,
  toolName: PaidToolName,
  count: number,
  cap: number
): Promise<void> {
  const dbUser = await findUserById(userId);
  const firstName = dbUser?.first_name ?? "there";

  const copy = TOOL_COPY[toolName];
  const nextYear = new Date().getUTCFullYear() + 1;

  const subject = `You're on pace with ${copy.label} this year`;

  // Body prose (mirrors cap-enforcement-copy.md §2 verbatim)
  const paragraph1 = `Hi ${escapeHtml(firstName)},`;
  const paragraph2 = `You've ${copy.capCopyVerb} ${count} ${copy.unitPlural} this year with ${copy.label}. Your annual plan covers up to ${cap} per calendar year, and your allowance resets on <strong>January 1, ${nextYear}</strong>.`;
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
    preHeaderText: `You've ${copy.capCopyVerb} ${count} of ${cap} ${copy.unitPlural} this year`,
    eyebrowLabel: copy.label,
    heroContent,
  });

  await sendEmail(userEmail, subject, html);
}

// ─── Calvin 80% operational alert email ─────────────────────────────────────

async function sendCalvin80Email(
  userId: string,
  userEmail: string,
  toolName: PaidToolName,
  count: number,
  cap: number
): Promise<void> {
  const dbUser = await findUserById(userId);
  const firstName = dbUser?.first_name ?? null;
  const jobTitle = dbUser?.job_title ?? null;

  const copy = TOOL_COPY[toolName];
  const year = new Date().getUTCFullYear();
  const nextYear = year + 1;

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

  // Machine-plain body (not branded). Uses monospace for scannability.
  const lines: string[] = [
    `${userEmail} has used ${count} of ${cap} ${copy.shortLabel} runs this calendar year on their annual subscription.`,
    "",
    ...(profileLine ? [profileLine] : []),
    `Current year: ${year}`,
    `Reset date: January 1, ${nextYear}`,
    "Admin dashboard: https://promptaiagents.com/admin/usage",
    "",
    `The user has been sent the standard "on pace" email. No action required unless pattern looks abusive.`,
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

// ─── Public entry point ─────────────────────────────────────────────────────

/**
 * Fire threshold alerts if this run crossed 75% or 80% of the annual cap.
 * Safe to call fire-and-forget: catches its own errors, never throws.
 *
 * @param runCountAfterThisRun  The count including this just-completed run.
 *                               Call with `runCount + 1` where `runCount` is
 *                               the pre-log value returned by getAnnualToolRunCount.
 */
export async function checkAndFireThresholdAlerts(
  userId: string,
  userEmail: string,
  toolName: PaidToolName,
  runCountAfterThisRun: number,
  annualCap: number
): Promise<void> {
  try {
    const pct = runCountAfterThisRun / annualCap;

    // Below 75% → nothing to do.
    if (pct < 0.75) return;

    // 75% user email. Idempotent via claimAlertSlot.
    // Claim first on every call at or above 75%; if already claimed this year,
    // the INSERT is a no-op and we skip the send.
    if (pct >= 0.75) {
      const claimed = await claimAlertSlot(userId, toolName, "user_75");
      if (claimed) {
        await sendUser75Email(userId, userEmail, toolName, runCountAfterThisRun, annualCap);
      }
    }

    // 80% Calvin email. Idempotent via claimAlertSlot. Fires in addition to,
    // not in place of, the user email. Edge case (burst through 75% and 80%
    // in the same request) is handled naturally: both claims succeed on this
    // call and both emails send.
    if (pct >= 0.80) {
      const claimed = await claimAlertSlot(userId, toolName, "calvin_80");
      if (claimed) {
        await sendCalvin80Email(userId, userEmail, toolName, runCountAfterThisRun, annualCap);
      }
    }
  } catch (err) {
    console.error("[checkAndFireThresholdAlerts] failed:", err);
  }
}
