import { NextRequest, NextResponse } from "next/server";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
} from "@/app/api/_shared/emailBase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PIPEmailBody {
  email: string;
  filename: string;
  employeeRole: string;
  timeline: string; // "30", "60", or "90"
  fileData: string; // base64-encoded .docx
}

// ─── Email builder ────────────────────────────────────────────────────────────

async function sendPIPEmail(
  email: string,
  filename: string,
  employeeRole: string,
  timeline: string,
  fileData: string
): Promise<void> {
  const sections = [
    { label: "Opening Statement", detail: "Purpose of the plan and the context for issuing it." },
    { label: "Performance Deficiencies", detail: "Specific gaps documented in observable, measurable language." },
    { label: "Improvement Targets", detail: `Clear expectations for the ${timeline}-day plan period.` },
    { label: "Support and Resources", detail: "What the company is offering to support improvement." },
    { label: "Check-in Schedule", detail: "Scheduled touchpoints to review progress." },
    { label: "Consequences", detail: "What happens if improvement targets are not met." },
    { label: "Signature Block", detail: "Acknowledgment of receipt. Not agreement." },
  ];

  const heroContent = `
    <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#1e7ab8; letter-spacing:-0.01em;">
      Your PIP document is attached
    </p>
    <h1 style="margin:0 0 16px 0; font-size:26px; font-weight:800; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      ${employeeRole} · ${timeline}-day plan
    </h1>
    <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
      Here's the Performance Improvement Plan for the ${employeeRole} you described, built as a ${timeline}-day plan.
    </p>
    <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
      Open in Microsoft Word or Google Docs, review with your manager and legal team, and customize before issuing. The [Employee Name] placeholder appears throughout. Fill that in before sharing.
    </p>

    <!-- Document contents card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:12px; margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px 0; font-size:13px; font-weight:700; color:#161618; letter-spacing:-0.01em;">
            Your document includes
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${sections.map((s) => `
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #e4e4e2;">
                <p style="margin:0; font-size:13px; color:#161618; font-weight:600;">
                  <span style="color:#1e7ab8; font-weight:700; margin-right:8px;">·</span>${s.label}
                </p>
                <p style="margin:2px 0 0 18px; font-size:12px; color:#888886;">
                  ${s.detail}
                </p>
              </td>
            </tr>`).join("")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Tip line -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#EBF5FF; border:1px solid #c8dff0; border-radius:10px; margin-bottom:32px;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0; font-size:13px; color:#1E5A8A; line-height:1.5;">
            <strong>Review with your manager and legal team before issuing.</strong>
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
    <a href="https://promptaiagents.com/pip-builder"
       style="display:inline-block; background:#161618; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:13px 26px; border-radius:8px; letter-spacing:-0.01em;">
      Build another PIP
    </a>
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `Your ${employeeRole} PIP is ready — ${timeline}-day plan attached`,
    eyebrowLabel: "AGENT: PIP Builder",
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
      subject: `Your PIP document: ${employeeRole}, ${timeline}-day plan`,
      html,
      attachments: [{ filename, content: fileData }],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PIPEmailBody;
    const { email, filename, employeeRole, timeline, fileData } = body;

    if (!email || !filename || !fileData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "paste_your_resend_api_key_here"
    ) {
      console.log(`[pip-builder-email] Mock send to: ${email} | File: ${filename}`);
      return NextResponse.json({ success: true, mock: true });
    }

    await Promise.all([
      addContactToAudience(email),
      sendPIPEmail(email, filename, employeeRole, timeline, fileData),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PIP Builder Email API error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
