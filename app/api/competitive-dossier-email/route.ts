import { NextRequest, NextResponse } from "next/server";
import { buildBaseEmailHTML, getFromAddress, addContactToAudience, RESEND_API } from "@/app/api/_shared/emailBase";
import { logToolUsage } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── AGENT: Company email delivery ───────────────────────────────────────
// Receives the .docx as base64 and sends it to the user's inbox via Resend.
// Also fires simultaneously with the browser download on the frontend.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email: string;
      companyName: string;
      jobTitle: string;
      docxBase64: string;
      userId?: string;
    };

    const { email, companyName, jobTitle, docxBase64, userId } = body;

    if (!email || !companyName || !docxBase64) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const safeFilename = `${companyName.replace(/[^a-zA-Z0-9]/g, "-")}-Dossier.docx`;

    const heroContent = `
      <h1 style="margin:0 0 6px 0; font-family:Georgia,serif; font-size:28px; font-weight:700; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
        Your dossier on ${companyName} is attached.
      </h1>
      <p style="margin:0 0 24px 0; font-size:16px; color:#555553; font-weight:600; line-height:1.3;">
        ${companyName} · ${jobTitle}
      </p>

      <p style="margin:0 0 28px 0; font-size:15px; color:#555553; line-height:1.6;">
        Here's your competitive intelligence dossier on ${companyName}, tailored for your role as ${jobTitle}. The full report is attached as a Word document. Open it in Word or Google Docs. Share it with your team.
      </p>

      <!-- What's included card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0; border:1px solid #e4e4e2; border-radius:8px; overflow:hidden;">
        <tr>
          <td style="padding:20px 24px; background:#fafaf8;">
            <p style="font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.1em; color:#1e7ab8; text-transform:uppercase; margin:0 0 16px;">
              Your dossier includes
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0 10px; border-bottom:1px solid #e4e4e2; vertical-align:top;">
                  <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#161618; line-height:1.4;">Company Snapshot</p>
                  <p style="margin:0; font-size:13px; color:#888886; line-height:1.5;">What they do, where they sit, and how big they are.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e4e4e2; vertical-align:top;">
                  <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#161618; line-height:1.4;">Business Model and Pricing</p>
                  <p style="margin:0; font-size:13px; color:#888886; line-height:1.5;">How they make money and what they charge.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e4e4e2; vertical-align:top;">
                  <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#161618; line-height:1.4;">Target Market and Positioning</p>
                  <p style="margin:0; font-size:13px; color:#888886; line-height:1.5;">Who they sell to and how they frame it.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e4e4e2; vertical-align:top;">
                  <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#161618; line-height:1.4;">Product and Service Breakdown</p>
                  <p style="margin:0; font-size:13px; color:#888886; line-height:1.5;">What they offer and how deep it goes.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e4e4e2; vertical-align:top;">
                  <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#161618; line-height:1.4;">Growth Signals</p>
                  <p style="margin:0; font-size:13px; color:#888886; line-height:1.5;">Hiring patterns, content focus, and expansion moves.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e4e4e2; vertical-align:top;">
                  <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#161618; line-height:1.4;">Content and Public Voice</p>
                  <p style="margin:0; font-size:13px; color:#888886; line-height:1.5;">What they publish and who they write for.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e4e4e2; vertical-align:top;">
                  <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#161618; line-height:1.4;">Strengths and Gaps</p>
                  <p style="margin:0; font-size:13px; color:#888886; line-height:1.5;">Where they lead and where they leave openings.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0 6px; vertical-align:top;">
                  <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#161618; line-height:1.4;">What This Means for You</p>
                  <p style="margin:0; font-size:13px; color:#888886; line-height:1.5;">Personalized next steps for your role and industry.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 32px 0; font-size:13px; color:#888886;">
        📎 ${safeFilename} · 8-section report · .docx format
      </p>

      <!-- CTA -->
      <a href="https://promptaiagents.com/company"
         style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:8px;">
        Build another dossier
      </a>

      <!-- Cross-sell -->
      <div style="padding:32px 0 0 0; border-top:1px solid #e4e4e2;">
        <p style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600; letter-spacing:0.06em; color:#1e7ab8; text-transform:uppercase; margin:0 0 12px;">
          YOUR NEXT STEP
        </p>
        <h3 style="font-family:Georgia,serif; font-size:24px; font-weight:400; color:#161618; margin:0 0 8px; line-height:1.2;">
          AGENT: Workflow
        </h3>
        <p style="font-size:14px; color:#555553; line-height:1.6; margin:0 0 4px;">
          Turn any recurring task into a step-by-step workflow with AI prompts, time estimates, and a ready-to-use playbook.
        </p>
        <p style="font-size:14px; color:#555553; line-height:1.6; margin:0 0 28px;">
          Built for real jobs. Not demos.
        </p>
        <div style="text-align:center;">
          <a href="https://promptaiagents.com/workflow"
             style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; padding:14px 28px; border-radius:8px; text-decoration:none;">
            Try AGENT: Workflow
          </a>
        </div>
      </div>
    `;

    const emailHtml = buildBaseEmailHTML({
      preHeaderText: `Your competitive intelligence dossier on ${companyName} is ready`,
      eyebrowLabel: "AGENT: Company",
      heroContent,
    });

    const resendPayload = {
      from: getFromAddress(),
      to: [email],
      subject: `Your dossier on ${companyName}: ${jobTitle}`,
      html: emailHtml,
      attachments: [
        {
          filename: safeFilename,
          content: docxBase64,
          encoding: "base64" as const,
        },
      ],
    };

    const resendRes = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("[competitive-dossier-email] Resend error:", errBody);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Fire-and-forget: log tool usage + add to audience
    void logToolUsage(email, "company", ipAddress, userId ?? null);
    void addContactToAudience(email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[competitive-dossier-email] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
