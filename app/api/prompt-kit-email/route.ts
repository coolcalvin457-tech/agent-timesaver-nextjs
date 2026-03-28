import { NextRequest, NextResponse } from "next/server";
import type { PromptItem, PromptCategory, PromptKitResponse } from "@/app/api/prompt-kit/route";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
} from "@/app/api/_shared/emailBase";

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
                  ${p.title}
                </p>
                <p style="margin:0; font-size:13px; color:#555553; line-height:1.65; font-family:monospace; background:#eeeeed; border-radius:6px; padding:10px 12px;">
                  ${p.prompt}
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
          <span style="color:#aaaaaa;">${String(catIndex + 1).padStart(2, "0")}</span> <span style="color:#1e7ab8;">${category.name}</span>
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

  const totalPrompts = promptKit.categories.reduce(
    (sum, cat) => sum + cat.prompts.length,
    0
  );

  const heroContent = `
    <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#555553; letter-spacing:-0.01em;">
      Your Prompt Kit is ready
    </p>
    <h1 style="margin:0 0 8px 0; font-size:26px; font-weight:800; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      ${totalPrompts} AI prompts built for ${jobTitle}.
    </h1>
    <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
      Copy any prompt below and paste it directly into your AI tool of choice.
    </p>

    <!-- Step 1: Prompts by category -->
    <p style="margin:0 0 16px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#1e7ab8;">
      STEP 1 &nbsp;/&nbsp; YOUR ${totalPrompts} PROMPTS
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${categoryRows}
    </table>

    <!-- Step 2: AI Profile -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px; margin-bottom:32px;">
      <tr>
        <td style="background:#f0f7fc; border:1px solid #bdd9ee; border-radius:12px; padding:24px;">
          <p style="margin:0 0 4px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#1e7ab8;">
            STEP 2 &nbsp;/&nbsp; SET UP YOUR AI PROFILE
          </p>
          <p style="margin:0 0 14px 0; font-size:13px; color:#555553; line-height:1.6;">
            Paste this into your AI once. Every output after will gradually get better over time, as AI learns who you are.
          </p>
          <p style="margin:0; font-size:13px; color:#333331; line-height:1.7; font-family:monospace; background:#ffffff; border:1px solid #d0e8f5; border-radius:8px; padding:14px 16px;">
            ${promptKit.aiProfile}
          </p>
        </td>
      </tr>
    </table>

    <!-- Step 3: AI Workspace Setup -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:12px; padding:24px;">
          <p style="margin:0 0 4px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#1e7ab8;">
            STEP 3 &nbsp;/&nbsp; YOUR AI WORKSPACE SETUP
          </p>
          <p style="margin:0 0 14px 0; font-size:13px; color:#555553; line-height:1.6;">
            Set this up once. AI will know who you are every time.
          </p>
          <p style="margin:0 0 14px 0; font-size:13px; color:#333331; line-height:1.5; font-family:monospace; background:#ffffff; border:1px solid #e4e4e2; border-radius:8px; padding:14px 16px;">
            Build this folder structure on your desktop:<br/><br/>
            &#128450; [YourName]'s AI Workspace<br/>
            &nbsp;&nbsp;&#128196; AI Profile.md<br/>
            &nbsp;&nbsp;&#128450; Prompt Library<br/>
            &nbsp;&nbsp;&#128450; Saved Results<br/>
            &nbsp;&nbsp;&#128450; Reference Files
          </p>
          <p style="margin:0 0 8px 0; font-size:12px; color:#888886; line-height:1.6;">
            AI Profile.md is what your AI will reference. Update as you go.
          </p>
          <p style="margin:0; font-size:12px; color:#888886; line-height:1.6;">
            When AI gives you something worth keeping, ask it to save as an .md file. AI will now remember your info between chats.
          </p>
        </td>
      </tr>
    </table>

    <!-- Cross-sell: AGENT: Workflow Builder -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px; border-top:1px solid #e4e4e2; padding-top:32px;">
      <tr>
        <td>
          <p style="margin:0 0 4px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#888886;">
            YOUR NEXT STEP
          </p>
          <p style="margin:0 0 16px 0; font-size:22px; font-weight:800; color:#161618; line-height:1.2; letter-spacing:-0.02em;">
            AGENT: Workflow Builder
          </p>
          <p style="margin:0 0 4px 0; font-size:14px; color:#555553; line-height:1.6;">
            Turn your prompts into repeatable AI workflows.
          </p>
          <p style="margin:0 0 24px 0; font-size:14px; color:#555553; line-height:1.6;">
            Built for real jobs. Not demos.
          </p>
          <a href="https://promptaiagents.com/agents"
             style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:10px;">
            Try Now
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `${totalPrompts} prompts built for ${jobTitle}. Your AI Profile is inside`,
    eyebrowLabel: "AGENT: Prompt Builder",
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
      subject: `Your AI Prompt Kit for ${jobTitle}`,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Prompt Kit Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
