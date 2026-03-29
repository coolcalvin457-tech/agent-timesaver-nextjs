import { NextRequest, NextResponse } from "next/server";
import type { Workflow, ROI } from "@/app/api/workflows/route";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
} from "@/app/api/_shared/emailBase";
import { stripEmDashes } from "@/app/api/_shared/sanitize";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmailRequestBody {
  email: string;
  jobTitle: string;
  workflows: Workflow[];
  roi: ROI;
}

// ─── Email builder ────────────────────────────────────────────────────────────

async function sendResultsEmail(
  email: string,
  jobTitle: string,
  workflows: Workflow[],
  roi: ROI
): Promise<void> {
  const workflowRows = workflows
    .map(
      (wf, i) => `
      <tr>
        <td style="padding: 0 0 20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding: 20px 24px;">
                <p style="margin:0 0 4px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#888886;">
                  0${i + 1} &nbsp;·&nbsp; ${stripEmDashes(wf.tool)}
                </p>
                <p style="margin:4px 0 8px 0; font-size:15px; font-weight:700; color:#161618; line-height:1.3;">
                  ${stripEmDashes(wf.title)}
                </p>
                <p style="margin:0 0 10px 0; font-size:14px; color:#555553; line-height:1.6;">
                  ${stripEmDashes(wf.description)}
                </p>
                <p style="margin:0; font-size:13px; font-weight:600; color:#1e7ab8;">
                  Saves ~${wf.timeSavedPerWeek}h/week
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const heroContent = `
    <h1 style="margin:0 0 8px 0; font-family:Georgia,serif; font-size:28px; font-weight:700; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      Your AI workflows are ready.
    </h1>
    <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
      Based on your answers, here are the workflows that fit your role best. Plus a real estimate of the time you could get back every week.
    </p>

    <!-- Workflows -->
    <table width="100%" cellpadding="0" cellspacing="0">
      ${workflowRows}
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
        AGENT: Prompt Builder
      </h3>
      <p style="font-size:14px;color:#555553;line-height:1.6;margin:0 0 28px;">
        12 Personalized Prompts · AI Profile · AI Workspace Setup
      </p>
      <div style="text-align:center;">
        <a href="https://promptaiagents.com/prompt-builder" style="display:inline-block;background:#1e7ab8;color:#ffffff;font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Try Now
        </a>
      </div>
    </td></tr>
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `Your ${jobTitle} workflows are ready. Here's what you could save.`,
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
      subject: `Your 5 Workflows for ${jobTitle}`,
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
    const { email, jobTitle, workflows, roi } = body;

    if (!email || !jobTitle || !workflows || !roi) {
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
      sendResultsEmail(email, jobTitle, workflows, roi),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
