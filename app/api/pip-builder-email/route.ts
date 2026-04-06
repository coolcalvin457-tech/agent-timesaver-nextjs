import { NextRequest, NextResponse } from "next/server";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
} from "@/app/api/_shared/emailBase";
import { stripEmDashes } from "@/app/api/_shared/sanitize";
import { logToolUsage } from "@/lib/db";

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
  const heroContent = `
    <h1 style="margin:0 0 6px 0; font-family:Georgia,serif; font-size:28px; font-weight:700; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      Your PIP document is ready.
    </h1>
    <p style="margin:0 0 16px 0; font-size:16px; color:#555553; font-weight:600; line-height:1.3;">
      ${stripEmDashes(employeeRole)} · ${timeline}-day plan
    </p>
    <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
      Open in Microsoft Word or Google Docs, review with your manager and legal team. Customize before issuing.
    </p>

    <p style="margin:0 0 32px 0; font-size:13px; color:#888886;">
      📎 ${filename}
    </p>

    <!-- CTA -->
    <a href="https://promptaiagents.com/pip"
       style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:8px;">
      Build another PIP
    </a>

    <!-- Cross-sell separator -->
    <div style="padding:32px 0 0 0;border-top:1px solid #e4e4e2;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.06em;color:#1e7ab8;text-transform:uppercase;margin:0 0 12px;">
        YOUR NEXT STEP
      </p>
      <h3 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#161618;margin:0 0 12px;line-height:1.2;">
        AGENT: Onboarding
      </h3>
      <p style="font-size:14px;color:#555553;line-height:1.6;margin:0 0 4px;">
        Welcome Letter · First-Week Schedule · 30-60-90 Day Plan · New Hire Checklist
      </p>
      <p style="font-size:14px;color:#555553;line-height:1.6;margin:0 0 28px;">
        Included in your HR Agents Package.
      </p>
      <div style="text-align:center;">
        <a href="https://promptaiagents.com/onboarding" style="display:inline-block;background:#1e7ab8;color:#ffffff;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
          Try AGENT: Onboarding
        </a>
      </div>
    </div>
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `Your ${employeeRole} PIP is ready: ${timeline}-day plan attached`,
    eyebrowLabel: "AGENT: PIP",
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
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

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

    logToolUsage(email, "pip", ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AGENT: PIP Email API error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
