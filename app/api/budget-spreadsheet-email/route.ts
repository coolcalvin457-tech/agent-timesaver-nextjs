import { NextRequest, NextResponse } from "next/server";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
  buildCrossSellBlockHTML,
} from "@/app/api/_shared/emailBase";
import { stripEmDashes } from "@/app/api/_shared/sanitize";
import { logToolUsage } from "@/lib/db";

export const maxDuration = 60; // Email-only route — no Claude call

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetSpreadsheetEmailBody {
  email: string;
  filename: string;
  budgetTitle: string;
  fileData: string; // base64-encoded .xlsx
}

// ─── Email builder ────────────────────────────────────────────────────────────

async function sendBudgetEmail(
  email: string,
  filename: string,
  budgetTitle: string,
  fileData: string
): Promise<void> {
  const heroContent = `
    <h1 style="margin:0 0 6px 0; font-family:Georgia,serif; font-size:28px; font-weight:700; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      Your spreadsheet is ready.
    </h1>
    <p style="margin:0 0 16px 0; font-size:16px; color:#555553; font-weight:600; line-height:1.3;">
      ${stripEmDashes(budgetTitle)}
    </p>
    <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
      Open in Excel, Google Sheets, or Numbers. The "How to Use" tab walks you through every formula.
    </p>

    <!-- CTA -->
    <a href="https://promptaiagents.com/spreadsheets"
       style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:10px;">
      Build another spreadsheet
    </a>

    ${buildCrossSellBlockHTML({
      productName: "AGENT: Industry",
      checklistItems: [
        "Intel Report",
        "Relevant Insights",
        "Role-Specific",
      ],
      href: "https://promptaiagents.com/industry",
    })}
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `Your ${budgetTitle}`,
    eyebrowLabel: "AGENT: Spreadsheets",
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
      subject: "AGENT: SPREADSHEETS",
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
    const body = (await req.json()) as BudgetSpreadsheetEmailBody;
    const { email, filename, budgetTitle, fileData } = body;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    if (!email || !filename || !fileData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "paste_your_resend_api_key_here"
    ) {
      console.log(`[budget-spreadsheet-email] Mock send to: ${email} | File: ${filename}`);
      return NextResponse.json({ success: true, mock: true });
    }

    await Promise.all([
      addContactToAudience(email),
      sendBudgetEmail(email, filename, budgetTitle, fileData),
    ]);

    logToolUsage(email, "spreadsheets", ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AGENT: Spreadsheets Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
