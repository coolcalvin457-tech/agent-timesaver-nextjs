import { NextRequest, NextResponse } from "next/server";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
} from "@/app/api/_shared/emailBase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingKitEmailBody {
  email: string;
  filename: string;
  hireName: string;
  hireTitle: string;
  fileData: string; // base64-encoded .docx
}

// ─── Email builder ────────────────────────────────────────────────────────────

async function sendOnboardingKitEmail(
  email: string,
  filename: string,
  hireName: string,
  hireTitle: string,
  fileData: string
): Promise<void> {
  const heroContent = `
    <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#1e7ab8; letter-spacing:-0.01em;">
      ${hireName}'s onboarding kit is attached
    </p>
    <h1 style="margin:0 0 16px 0; font-size:26px; font-weight:800; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      ${hireName} · ${hireTitle}
    </h1>
    <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
      Here's your onboarding kit for ${hireName}, built for the ${hireTitle} role. It's attached below and ready to open.
    </p>

    <!-- Next steps -->
    <p style="margin:0 0 16px 0; font-size:15px; color:#555553; line-height:1.6;">
      Before you share this with ${hireName}, three quick steps:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="padding:0 0 12px 0;">
          <p style="margin:0; font-size:14px; color:#555553; line-height:1.6;">
            <strong style="color:#161618;">1.</strong> Have the hiring manager review and sign the Welcome Letter. It's written in their voice and should have their sign-off before it reaches ${hireName}.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 12px 0;">
          <p style="margin:0; font-size:14px; color:#555553; line-height:1.6;">
            <strong style="color:#161618;">2.</strong> Fill in any specifics the AI couldn't know: calendar invite links, meeting room details, IT setup.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0;">
          <p style="margin:0; font-size:14px; color:#555553; line-height:1.6;">
            <strong style="color:#161618;">3.</strong> Add your company logo or letterhead to remain on brand.
          </p>
        </td>
      </tr>
    </table>

    <!-- Attachment info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:10px; margin-bottom:32px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px 0; font-size:12px; font-weight:700; color:#888886; letter-spacing:0.04em; text-transform:uppercase;">
            Attached file
          </p>
          <p style="margin:0; font-size:13px; color:#333333; font-family:monospace;">
            ${filename}
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <a href="https://promptaiagents.com/onboarding-kit-builder"
       style="display:inline-block; background:#161618; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:13px 26px; border-radius:8px; letter-spacing:-0.01em;">
      Build another kit
    </a>
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `${hireName}'s onboarding kit is attached: ${hireTitle}`,
    eyebrowLabel: "AGENT: Onboarding Kit",
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
      subject: `Your onboarding kit for ${hireName}: ${hireTitle}`,
      html,
      attachments: [{ filename, content: fileData }],
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
    const body = (await req.json()) as OnboardingKitEmailBody;
    const { email, filename, hireName, hireTitle, fileData } = body;

    if (!email || !filename || !fileData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "paste_your_resend_api_key_here"
    ) {
      console.log(`[onboarding-kit-email] Mock send to: ${email} | File: ${filename}`);
      return NextResponse.json({ success: true, mock: true });
    }

    await Promise.all([
      addContactToAudience(email),
      sendOnboardingKitEmail(email, filename, hireName, hireTitle, fileData),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding Kit Email API error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
