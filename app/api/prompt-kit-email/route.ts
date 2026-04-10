import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Email-only route, no Claude call

import type { PromptItem, PromptCategory, PromptKitResponse } from "@/app/api/prompt-kit/route";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
  buildCrossSellBlockHTML,
} from "@/app/api/_shared/emailBase";
import { stripEmDashes } from "@/app/api/_shared/sanitize";
import { logToolUsage } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PromptKitEmailRequestBody {
  email: string;
  jobTitle: string;
  promptKit: PromptKitResponse;
}

// ─── Email builder ────────────────────────────────────────────────────────────

function buildCategoryHTML(category: PromptCategory, catIndex: number): string {
  const promptRows = category.prompts
    .map(
      (p: PromptItem) => `
      <tr>
        <td style="padding: 0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding: 20px 24px;">
                <p style="margin:0 0 6px 0; font-size:14px; font-weight:700; color:#161618;">
                  ${stripEmDashes(p.title)}
                </p>
                <p style="margin:0; font-size:13px; color:#555553; line-height:1.65; font-family:monospace; background:#eeeeed; border-radius:6px; padding:10px 12px;">
                  ${stripEmDashes(p.prompt)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  return `
    <tr>
      <td style="padding: 0 0 8px 0;">
        <p style="margin:0; padding-left:8px; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase;">
          <span style="color:#aaaaaa;">${String(catIndex + 1).padStart(2, "0")}</span> <span style="color:#1e7ab8;">${stripEmDashes(category.name)}</span>
        </p>
      </td>
    </tr>
    ${promptRows}
    <tr><td style="height:8px;"></td></tr>
  `;
}

async function sendPromptKitEmail(
  email: string,
  jobTitle: string,
  promptKit: PromptKitResponse
): Promise<void> {
  const categoryRows = promptKit.categories
    .map((cat, i) => buildCategoryHTML(cat, i))
    .join("");

  const heroContent = `
    <!-- Step 1: AI Workspace Setup -->
    <p style="margin:0 0 6px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#1e7ab8;">
      STEP 1
    </p>
    <h1 style="margin:0 0 8px 0; font-family:Georgia,'Times New Roman',serif; font-size:28px; font-weight:700; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      Your AI Workspace Setup.
    </h1>
    <p style="margin:0 0 16px 0; font-size:13px; color:#888886; line-height:1.6;">
      Set this up once. AI will know who you are every time.
    </p>
    <!-- S137: Styled folder tree card. Matches website redesign. -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:8px; padding:20px 24px;">
          <p style="margin:0 0 14px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#aaaaaa;">
            Folder structure
          </p>
          <p style="margin:0 0 6px 0; font-family:monospace; font-size:13px; font-weight:600; color:#161618;">
            &#9656; [YourName]'s AI Workspace
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-left:8px; border-left:1px solid #e4e4e2;">
            <tr><td style="padding:4px 0 4px 14px; font-family:monospace; font-size:13px; color:#444442;">AI Profile.md</td></tr>
            <tr><td style="padding:4px 0 4px 14px; font-family:monospace; font-size:13px; color:#777775;"><span style="color:#1e7ab8; font-size:11px;">&#9656;</span> Prompt Library</td></tr>
            <tr><td style="padding:4px 0 4px 14px; font-family:monospace; font-size:13px; color:#777775;"><span style="color:#1e7ab8; font-size:11px;">&#9656;</span> Saved Results</td></tr>
            <tr><td style="padding:4px 0 4px 14px; font-family:monospace; font-size:13px; color:#777775;"><span style="color:#1e7ab8; font-size:11px;">&#9656;</span> Reference Files</td></tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 32px 0; font-size:13px; color:#888886; line-height:1.6;">
      Add this on your desktop so AI can reference it going forward.
    </p>

    <!-- Step 2: AI Profile -->
    <p style="margin:0 0 6px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#1e7ab8;">
      STEP 2
    </p>
    <p style="margin:0 0 8px 0; font-family:Georgia,'Times New Roman',serif; font-size:28px; font-weight:400; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      Your AI Profile.
    </p>
    <p style="margin:0 0 16px 0; font-size:13px; color:#888886; line-height:1.6;">
      Paste this into AI once. No need to keep re-introducing yourself.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:8px; padding:14px 16px; font-size:13px; color:#333331; line-height:1.7; font-family:monospace;">
          ${stripEmDashes(promptKit.aiProfile)}
        </td>
      </tr>
    </table>
    <p style="margin:0 0 32px 0; font-size:13px; color:#888886; line-height:1.6;">
      Tell AI to save its response as <strong>AI Profile.md</strong>
    </p>

    <!-- Step 3: Prompts by category -->
    <p style="margin:0 0 6px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#1e7ab8;">
      STEP 3
    </p>
    <p style="margin:0 0 8px 0; font-family:Georgia,'Times New Roman',serif; font-size:28px; font-weight:400; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      12 Prompts for ${jobTitle}.
    </p>
    <p style="margin:0 0 24px 0; font-size:13px; color:#888886; line-height:1.6;">
      Copy and paste into your AI tool of choice.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      ${categoryRows}
    </table>

    ${buildCrossSellBlockHTML({
      productName: "AGENT: Workflow",
      checklistItems: [
        "Workflow Playbook",
        "AI Setup",
        "Key Insights",
      ],
      href: "https://promptaiagents.com/workflow",
    })}
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `An AI prompt kit for ${jobTitle}`,
    eyebrowLabel: "AGENT: Prompts",
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
      subject: "AGENT: PROMPTS",
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
    const body = (await req.json()) as PromptKitEmailRequestBody;
    const { email, jobTitle, promptKit } = body;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    if (!email || !jobTitle || !promptKit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "paste_your_resend_api_key_here"
    ) {
      console.log(`[prompt-kit-email] Would send to: ${email} | Job: ${jobTitle}`);
      return NextResponse.json({ success: true, mock: true });
    }

    await Promise.all([
      addContactToAudience(email),
      sendPromptKitEmail(email, jobTitle, promptKit),
    ]);

    logToolUsage(email, "prompts", ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AGENT: Prompts Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
