import { NextRequest, NextResponse } from "next/server";
import {
  RESEND_API,
  getFromAddress,
  addContactToAudience,
  buildBaseEmailHTML,
} from "@/app/api/_shared/emailBase";

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
    <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#1e7ab8; letter-spacing:-0.01em;">
      Your spreadsheet is attached
    </p>
    <h1 style="margin:0 0 16px 0; font-size:26px; font-weight:800; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      ${budgetTitle}
    </h1>
    <p style="margin:0 0 32px 0; font-size:15px; color:#555553; line-height:1.6;">
      Open in Excel, Google Sheets, or Numbers. The "How to Use" tab walks you through every formula.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:12px; margin-bottom:32px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px 0; font-size:13px; font-weight:700; color:#161618;">
            Attached file
          </p>
          <p style="margin:0; font-size:13px; color:#555553; font-family:monospace;">
            ${filename}
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <a href="https://promptaiagents.com/budget-spreadsheets"
       style="display:inline-block; background:#161618; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:10px;">
      Build another spreadsheet
    </a>
  `;

  const html = buildBaseEmailHTML({
    preHeaderText: `Your ${budgetTitle} is ready to open`,
    eyebrowLabel: "AGENT: Budget Spreadsheets",
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
      subject: `Your ${budgetTitle} is ready. AGENT: Budget Spreadsheets`,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Budget Spreadsheet Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
