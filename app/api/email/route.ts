import { NextRequest, NextResponse } from "next/server";
import type { Workflow, ROI } from "@/app/api/workflows/route";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmailRequestBody {
  email: string;
  jobTitle: string;
  workflows: Workflow[];
  roi: ROI;
}

// ─── Resend REST helpers ──────────────────────────────────────────────────────
const RESEND_API = "https://api.resend.com";

async function addContactToAudience(email: string): Promise<void> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) return; // Audience ID not configured — skip silently

  await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });
  // We don't throw on failure here — a list error shouldn't block the results email
}

async function sendResultsEmail(
  email: string,
  jobTitle: string,
  workflows: Workflow[],
  roi: ROI
): Promise<void> {
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const from = `Prompt AI Agents <${fromAddress}>`;

  const workflowRows = workflows
    .map(
      (wf, i) => `
      <tr>
        <td style="padding: 0 0 20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding: 20px 24px;">
                <p style="margin:0 0 4px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#888886;">
                  Workflow 0${i + 1} &nbsp;·&nbsp; Saves ~${wf.timeSavedPerWeek}h/week &nbsp;·&nbsp; ${wf.tool}
                </p>
                <p style="margin:4px 0 8px 0; font-size:15px; font-weight:700; color:#161618; line-height:1.3;">
                  ${wf.title}
                </p>
                <p style="margin:0; font-size:14px; color:#555553; line-height:1.6;">
                  ${wf.description}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your AI Workflows. AGENT: Timesaver</title>
</head>
<body style="margin:0; padding:0; background:#f0f0ee; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; -webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ee; padding: 48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <p style="margin:0; font-family:monospace; font-size:13px; font-weight:600; letter-spacing:0.06em; color:#16425b;">
                AGENT: Timesaver
              </p>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#ffffff; border:1px solid #e4e4e2; border-radius:16px; padding:40px; margin-bottom:24px;">
              <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#1e7ab8; letter-spacing:-0.01em;">
                Here are your results
              </p>
              <h1 style="margin:0 0 8px 0; font-size:28px; font-weight:800; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
                5 AI workflows built for ${jobTitle}.
              </h1>
              <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
                Based on your answers, here are the workflows that fit your role best — and a real estimate of the time you could get back every week.
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
                      Value at average ${roi.industry} salary
                    </p>
                    <p style="margin:0 0 2px 0; font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.025em;">
                      ${roi.valueAtSalary} / year
                    </p>
                    <p style="margin:0; font-size:13px; color:rgba(255,255,255,0.5);">
                      Based on publicly available industry data
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td>
                    <p style="margin:0 0 16px 0; font-size:15px; color:#555553; line-height:1.6;">
                      Your workflows are ready. Now build the prompts to run them.
                    </p>
                    <a href="https://promptaiagents.com/prompt-builder"
                       style="display:inline-block; background:#161618; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:10px;">
                      Try AGENT: Prompt Builder
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0;">
              <p style="margin:0; font-size:13px; color:#888886; line-height:1.6;">
                You're receiving this because you used AGENT: Timesaver at
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

  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `Your 5 AI workflows for ${jobTitle}. AGENT: Timesaver`,
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
