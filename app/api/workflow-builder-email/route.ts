import { NextRequest, NextResponse } from "next/server";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
} from "@/app/api/_shared/emailBase";
import { stripEmDashes } from "@/app/api/_shared/sanitize";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowEmailBody {
  email: string;
  filename: string;
  taskTitle: string;
  stepCount: string;
  frequency: string;
  fileData: string; // base64-encoded .docx
}

// ─── Email builder ────────────────────────────────────────────────────────────

async function sendWorkflowEmail(
  email: string,
  filename: string,
  taskTitle: string,
  stepCount: string,
  frequency: string,
  fileData: string
): Promise<void> {
  const cleanTitle = stripEmDashes(taskTitle);
  const stepLabel = stepCount ? `${stepCount}-step workflow` : "workflow";

  const heroContent = `
    <h1 style="margin:0 0 6px 0; font-family:Georgia,serif; font-size:28px; font-weight:700; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      Your workflow is ready.
    </h1>
    <p style="margin:0 0 24px 0; font-size:16px; color:#555553; font-weight:600; line-height:1.3;">
      ${cleanTitle}
    </p>

    <!-- What's included card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0; border:1px solid #e4e4e2; border-radius:8px; overflow:hidden;">
      <tr>
        <td style="padding:20px 24px; background:#fafaf8;">
          <p style="font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.1em; color:#1e7ab8; text-transform:uppercase; margin:0 0 14px;">
            Your workflow includes
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:5px 0; font-size:14px; color:#333333; line-height:1.5; vertical-align:top;">
                <span style="color:#1e7ab8; font-weight:600;">Workflow Playbook</span>
                <span style="color:#888886;"> &nbsp;·&nbsp; </span>
                <span style="color:#555553;">Your full step-by-step process, start to finish</span>
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0; font-size:14px; color:#333333; line-height:1.5; vertical-align:top;">
                <span style="color:#1e7ab8; font-weight:600;">AI Setup</span>
                <span style="color:#888886;"> &nbsp;·&nbsp; </span>
                <span style="color:#555553;">Which tools to open at each step</span>
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0; font-size:14px; color:#333333; line-height:1.5; vertical-align:top;">
                <span style="color:#1e7ab8; font-weight:600;">AI Prompts</span>
                <span style="color:#888886;"> &nbsp;·&nbsp; </span>
                <span style="color:#555553;">Copy-pasteable prompts, ready to run</span>
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0; font-size:14px; color:#333333; line-height:1.5; vertical-align:top;">
                <span style="color:#1e7ab8; font-weight:600;">Time Estimates</span>
                <span style="color:#888886;"> &nbsp;·&nbsp; </span>
                <span style="color:#555553;">How long each step takes, and the total</span>
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0; font-size:14px; color:#333333; line-height:1.5; vertical-align:top;">
                <span style="color:#1e7ab8; font-weight:600;">Key Insights</span>
                <span style="color:#888886;"> &nbsp;·&nbsp; </span>
                <span style="color:#555553;">Specific tips for this workflow</span>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0; font-size:13px; color:#888886; line-height:1.4;">
            ${stepLabel} · ${frequency} · Formatted .docx attached below
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 32px 0; font-size:13px; color:#888886;">
      📎 ${filename}
    </p>

    <!-- CTA -->
    <a href="https://promptaiagents.com/workflow-builder"
       style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:10px;">
      Build another workflow
    </a>

    <!-- Cross-sell -->
    <tr><td style="padding:32px 0 0 0; border-top:1px solid #e4e4e2;">
      <p style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600; letter-spacing:0.06em; color:#1e7ab8; text-transform:uppercase; margin:0 0 12px;">
        YOUR NEXT STEP
      </p>
      <h3 style="font-family:Georgia,serif; font-size:24px; font-weight:400; color:#161618; margin:0 0 8px; line-height:1.2;">
        AGENT: Prompt Builder
      </h3>
      <p style="font-size:14px; color:#555553; line-height:1.6; margin:0 0 4px;">
        12 prompts built for your exact job title.
      </p>
      <p style="font-size:14px; color:#555553; line-height:1.6; margin:0 0 28px;">
        Free. Takes 3 minutes. Built for real jobs. Not demos.
      </p>
      <div style="text-align:center;">
        <a href="https://promptaiagents.com/prompt-builder"
           style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; padding:14px 28px; border-radius:10px; text-decoration:none;">
          Get Free Prompts
        </a>
      </div>
    </td></tr>
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `Your workflow for ${cleanTitle} is ready: ${stepLabel} attached`,
    eyebrowLabel: "AGENT: Workflow Builder",
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
      subject: `Your workflow is ready: ${cleanTitle}`,
      html,
      attachments: [{ filename, content: fileData }],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WorkflowEmailBody;
    const { email, filename, taskTitle, stepCount, frequency, fileData } = body;

    if (!email || !filename || !fileData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "paste_your_resend_api_key_here"
    ) {
      console.log(`[workflow-builder-email] Mock send to: ${email} | File: ${filename}`);
      return NextResponse.json({ success: true, mock: true });
    }

    await Promise.all([
      addContactToAudience(email),
      sendWorkflowEmail(email, filename, taskTitle, stepCount, frequency, fileData),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Workflow Builder Email API error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
