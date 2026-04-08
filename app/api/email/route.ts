import { NextRequest, NextResponse } from "next/server";
import type { TimeSaver, ROI } from "@/app/api/workflows/route";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
} from "@/app/api/_shared/emailBase";
import { stripEmDashes } from "@/app/api/_shared/sanitize";
import { logToolUsage } from "@/lib/db";

// NOTE (S115, F46): Timesaver outputs are "time-savers" everywhere in UI and
// email copy. "Workflow" is reserved for AGENT: Workflow paid tool. The
// import path "@/app/api/workflows/route" is an intentional non-migration.

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmailRequestBody {
  email: string;
  jobTitle: string;
  timeSavers: TimeSaver[];
  roi: ROI;
}

// ─── Email builder ────────────────────────────────────────────────────────────

async function sendResultsEmail(
  email: string,
  jobTitle: string,
  timeSavers: TimeSaver[],
  roi: ROI
): Promise<void> {
  const timeSaverRows = timeSavers
    .map(
      (ts, i) => `
      <tr>
        <td style="padding: 0 0 20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding: 20px 24px;">
                <p style="margin:0 0 4px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#888886;">
                  0${i + 1}
                </p>
                <p style="margin:4px 0 8px 0; font-size:15px; font-weight:700; color:#161618; line-height:1.3;">
                  ${stripEmDashes(ts.title)}
                </p>
                <p style="margin:0 0 10px 0; font-size:14px; color:#555553; line-height:1.6;">
                  ${stripEmDashes(ts.description)}
                </p>
                <p style="margin:0; font-size:13px; font-weight:600; color:#1e7ab8;">
                  Saves ~${ts.timeSavedPerWeek}h/week
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  // Intro paragraph removed (S111-F31, applied inline with S115-F46 since it
  // sat on the same edit surface). Headline goes directly to the cards.
  const heroContent = `
    <h1 style="margin:0 0 32px 0; font-family:Georgia,serif; font-size:28px; font-weight:700; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      Your AI time-savers are ready.
    </h1>

    <!-- Time-savers -->
    <table width="100%" cellpadding="0" cellspacing="0">
      ${timeSaverRows}
    </table>

    <!-- ROI Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#161618; border-radius:12px; margin-top:8px;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin:0 0 4px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.5);">
            Estimated weekly time savings
          </p>
          <p style="margin:0 0 2px 0; font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.025em;">
            ${roi.totalHoursPerWeek} hours / week
          </p>
          <p style="margin:0 0 16px 0; font-size:13px; color:rgba(255,255,255,0.5);">
            ${roi.annualHours} hours per year
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height:1px; background:rgba(255,255,255,0.1);"></td></tr>
          </table>
          <p style="margin:16px 0 4px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.5);">
            Value at average ${stripEmDashes(roi.industry)} salary
          </p>
          <p style="margin:0 0 2px 0; font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.025em;">
            ${stripEmDashes(roi.valueAtSalary)} / year
          </p>
          <p style="margin:0; font-size:13px; color:rgba(255,255,255,0.5);">
            Based on publicly available industry data
          </p>
        </td>
      </tr>
    </table>

    <!-- Cross-sell separator -->
    <tr><td style="padding:32px 0 0 0;border-top:1px solid #e4e4e2;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.06em;color:#1e7ab8;text-transform:uppercase;margin:0 0 12px;">
        YOUR NEXT STEP
      </p>
      <h3 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#161618;margin:0 0 12px;line-height:1.2;">
        AGENT: Prompts
      </h3>
      <p style="font-size:14px;color:#555553;line-height:1.6;margin:0 0 6px;">
        12 Personalized Prompts · AI Profile · AI Workspace Setup
      </p>
      <p style="font-size:14px;color:#555553;line-height:1.6;margin:0 0 28px;">
        Built for real jobs. Not demos.
      </p>
      <div style="text-align:center;">
        <a href="https://promptaiagents.com/prompts" style="display:inline-block;background:#1e7ab8;color:#ffffff;font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Try AGENT: Prompts
        </a>
      </div>
    </td></tr>
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `Your ${jobTitle} time-savers are ready. Here's what you could save.`,
    eyebrowLabel: "AGENT: Timesaver",
    heroContent,
  });

  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [email],
      // S117: Universal email subject rule (master spec Layer 1 §1.7).
      // Subject is the product identifier only — no personalization, no count,
      // no role echo. The pre-header + body headline carry the personalization.
      // Inbox reads as: sender ("Prompt AI Agents") → product ("AGENT: Timesaver")
      // → personalized hook ("Your Finance Director time-savers are ready..."),
      // a clean three-tier flow that also sidesteps the F46 lowercase-vs-titlecase
      // mix that the old "Your 5 AI time-savers for {jobTitle}" subject created.
      subject: "AGENT: Timesaver",
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EmailRequestBody;
    const { email, jobTitle, timeSavers, roi } = body;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    if (!email || !jobTitle || !timeSavers || !roi) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "paste_your_resend_api_key_here") {
      // No key configured — log locally and return success so the UI still works
      console.log(`[email] Would send to: ${email} | Job: ${jobTitle}`);
      return NextResponse.json({ success: true, mock: true });
    }

    // Run both in parallel — adding to list and sending email
    await Promise.all([
      addContactToAudience(email),
      sendResultsEmail(email, jobTitle, timeSavers, roi),
    ]);

    logToolUsage(email, "timesaver", ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
