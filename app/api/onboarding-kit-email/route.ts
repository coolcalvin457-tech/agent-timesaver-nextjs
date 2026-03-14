import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingKitEmailBody {
  email: string;
  filename: string;
  hireName: string;
  hireTitle: string;
  fileData: string; // base64-encoded .docx
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

async function sendOnboardingKitEmail(
  email: string,
  filename: string,
  hireName: string,
  hireTitle: string,
  fileData: string
): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Onboarding Kit for ${hireName} — AGENT: Onboarding Kit Builder</title>
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
                AGENT: Onboarding Kit Builder
              </p>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#ffffff; border:1px solid #e4e4e2; border-radius:16px; padding:40px;">
              <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#1e7ab8; letter-spacing:-0.01em;">
                ${hireName}'s onboarding kit is attached
              </p>
              <h1 style="margin:0 0 16px 0; font-size:26px; font-weight:800; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
                ${hireName} · ${hireTitle}
              </h1>
              <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
                Here's the onboarding kit for ${hireName}, built for the ${hireTitle} role. It includes a welcome letter, first-week schedule, key contacts, 30/60/90 day expectations, and a new hire checklist.
              </p>

              <!-- Kit contents card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:12px; margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px 0; font-size:13px; font-weight:700; color:#161618; letter-spacing:-0.01em;">
                      Your kit includes
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${["Welcome Letter", "First-Week Schedule", "Key Contacts", "Role Expectations (30/60/90)", "New Hire Checklist"].map(
                        (item) => `
                      <tr>
                        <td style="padding: 4px 0;">
                          <p style="margin:0; font-size:13px; color:#555553;">
                            <span style="color:#1e7ab8; font-weight:600; margin-right:8px;">·</span>${item}
                          </p>
                        </td>
                      </tr>`
                      ).join("")}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Tip line -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#EBF5FF; border:1px solid #c8dff0; border-radius:10px; margin-bottom:32px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0; font-size:13px; color:#1E5A8A; line-height:1.5;">
                      <strong>Tip:</strong> Personalize the welcome letter signature before sharing. It takes 30 seconds and makes it feel like it came from the hiring manager directly.
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
                Build another kit →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0;">
              <p style="margin:0; font-size:13px; color:#888886; line-height:1.6;">
                You're receiving this because you used AGENT: Onboarding Kit Builder at
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
      subject: `Your onboarding kit for ${hireName} — ${hireTitle}`,
      html,
      attachments: [
        {
          filename,
          content: fileData, // base64 string
        },
      ],
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
