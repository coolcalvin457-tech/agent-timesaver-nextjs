import { NextRequest, NextResponse } from "next/server";
import type { PromptItem, PromptCategory, PromptKitResponse } from "@/app/api/prompt-kit/route";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PromptKitEmailRequestBody {
  email: string;
  jobTitle: string;
  promptKit: PromptKitResponse;
}

// ─── Resend REST helpers ──────────────────────────────────────────────────────
const RESEND_API = "https://api.resend.com";

async function addContactToAudience(email: string): Promise<void> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) return;

  await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });
}

function buildCategoryHTML(category: PromptCategory, catIndex: number): string {
  const promptRows = category.prompts
    .map(
      (p: PromptItem, i: number) => `
      <tr>
        <td style="padding: 0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding: 20px 24px;">
                <p style="margin:0 0 6px 0; font-size:14px; font-weight:700; color:#161618;">
                  ${p.title}
                </p>
                <p style="margin:0 0 10px 0; font-size:13px; color:#555553; line-height:1.65; font-family:monospace; background:#eeeeed; border-radius:6px; padding:10px 12px;">
                  ${p.prompt}
                </p>
                <p style="margin:0; font-size:12px; color:#888886; font-style:italic;">
                  ${p.why}
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
        <p style="margin:0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#16425b;">
          ${String(catIndex + 1).padStart(2, "0")} &nbsp;/&nbsp; ${category.name}
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
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const from = `Prompt AI Agents <${fromAddress}>`;

  const categoryRows = promptKit.categories
    .map((cat, i) => buildCategoryHTML(cat, i))
    .join("");

  const totalPrompts = promptKit.categories.reduce(
    (sum, cat) => sum + cat.prompts.length,
    0
  );

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your AI Prompt Kit. AGENT: Prompt Builder</title>
</head>
<body style="margin:0; padding:0; background:#f0f0ee; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; -webkit-font-smoothing:antialiased;">

  <!-- Pre-header: controls inbox preview text -->
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${totalPrompts} prompts built for ${jobTitle}. Your AI Profile is inside.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ee; padding: 48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <p style="margin:0; font-family:monospace; font-size:13px; font-weight:600; letter-spacing:0.06em; color:#16425b;">
                AGENT: Prompt Builder
              </p>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#ffffff; border:1px solid #e4e4e2; border-radius:16px; padding:40px; margin-bottom:24px;">
              <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#1e7ab8; letter-spacing:-0.01em;">
                Your Prompt Kit is ready
              </p>
              <h1 style="margin:0 0 8px 0; font-size:26px; font-weight:800; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
                ${totalPrompts} AI prompts built for ${jobTitle}.
              </h1>
              <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
                Copy any prompt below and paste it directly into ChatGPT or Claude. Each one is ready to use. Just fill in the brackets and go.
              </p>

              <!-- AI Profile -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#f0f7fc; border:1px solid #bdd9ee; border-radius:12px; padding:24px;">
                    <p style="margin:0 0 4px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#16425b;">
                      Step 1 &nbsp;/&nbsp; Set up your AI Profile first
                    </p>
                    <p style="margin:0 0 14px 0; font-size:13px; color:#555553; line-height:1.6;">
                      Paste this into your AI tool's settings once. Every prompt you use after that gets better automatically — AI already knows who you are before you say a word.
                    </p>
                    <p style="margin:0 0 14px 0; font-size:13px; color:#333331; line-height:1.7; font-family:monospace; background:#ffffff; border:1px solid #d0e8f5; border-radius:8px; padding:14px 16px;">
                      ${promptKit.aiProfile}
                    </p>
                    <p style="margin:0; font-size:12px; color:#888886; line-height:1.6;">
                      <strong>ChatGPT:</strong> Settings &rarr; Personalization &rarr; Custom Instructions &nbsp;&nbsp;
                      <strong>Claude:</strong> Settings &rarr; Profile &nbsp;&nbsp;
                      <strong>Gemini:</strong> Settings &rarr; Extensions &amp; Personalization
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Prompts by category -->
              <p style="margin:0 0 16px 0; font-family:monospace; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#16425b;">
                Step 2 &nbsp;/&nbsp; Your ${totalPrompts} prompts
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${categoryRows}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td>
                    <a href="https://promptaiagents.com"
                       style="display:inline-block; background:#161618; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:10px;">
                      Your prompts are ready. Now build the workflows. &rarr;
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
                You're receiving this because you used AGENT: Prompt Builder at
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
      subject: `Your AI Prompt Kit for ${jobTitle}.`,
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
