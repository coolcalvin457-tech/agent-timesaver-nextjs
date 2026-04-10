import { NextRequest, NextResponse } from "next/server";
import { buildBaseEmailHTML, buildCrossSellBlockHTML, getFromAddress, addContactToAudience, RESEND_API } from "@/app/api/_shared/emailBase";
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
        Your dossier is ready.
      </h1>

      <!-- CTA -->
      <a href="https://promptaiagents.com/company"
         style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:8px;">
        Build another dossier
      </a>

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

    const emailHtml = buildBaseEmailHTML({
      preHeaderText: `A competitive dossier on ${companyName}`,
      eyebrowLabel: "AGENT: Company",
      heroContent,
    });

    const resendPayload = {
      from: getFromAddress(),
      to: [email],
      subject: "AGENT: COMPANY",
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
