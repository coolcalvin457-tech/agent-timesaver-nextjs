import { NextRequest, NextResponse } from "next/server";
import { buildBaseEmailHTML, getFromAddress, addContactToAudience, RESEND_API } from "@/app/api/_shared/emailBase";
import { logToolUsage } from "@/lib/db";

export const dynamic = "force-dynamic";

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

    const heroContent = `
      <h1 style="margin:0 0 12px 0; font-family:Georgia,serif; font-size:26px; font-weight:400; color:#111110; line-height:1.3;">
        Your dossier on ${companyName} is attached.
      </h1>
      <p style="margin:0 0 20px 0; font-size:15px; color:#444442; line-height:1.7;">
        Here's your competitive intelligence dossier on ${companyName}, tailored for your role as ${jobTitle}.
        The full report is attached as a Word document.
      </p>
      <p style="margin:0; font-size:13px; color:#888886; line-height:1.6;">
        Open it in Word or Google Docs. Share it with your team. Keep it for reference before your next meeting.
      </p>
    `;

    const emailHtml = buildBaseEmailHTML({
      preHeaderText: `Your competitive intelligence dossier on ${companyName} is ready`,
      eyebrowLabel: "AGENT: Company",
      heroContent,
    });

    // Convert base64 to binary for Resend attachment
    const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, "-")}-Dossier.docx`;

    const resendPayload = {
      from: getFromAddress(),
      to: [email],
      subject: `Your dossier on ${companyName}`,
      html: emailHtml,
      attachments: [
        {
          filename,
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
