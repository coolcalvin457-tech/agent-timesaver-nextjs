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

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowEmailBody {
  email: string;
  filename: string;
  taskTitle: string;
  stepCount: string;
  frequency: string;
  fileData: string; // base64-encoded .docx
}

// ─── Email builder ────────────────────────────────────────────────────────────

async function sendWorkflowEmail(
  email: string,
  filename: string,
  taskTitle: string,
  stepCount: string,
  frequency: string,
  fileData: string
): Promise<void> {
  const cleanTitle = stripEmDashes(taskTitle);
  const stepLabel = stepCount ? `${stepCount}-step workflow` : "workflow";

  const heroContent = `
    <h1 style="margin:0 0 6px 0; font-family:Georgia,serif; font-size:28px; font-weight:700; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      Your workflow is ready.
    </h1>

    <!-- CTA -->
    <a href="https://promptaiagents.com/workflow"
       style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:8px;">
      Build another workflow
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
    preHeaderText: `Your ${cleanTitle} workflow`,
    eyebrowLabel: "AGENT: Workflow",
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
      subject: "AGENT: WORKFLOW",
      html,
      attachments: [{ filename, content: fileData }],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WorkflowEmailBody;
    const { email, filename, taskTitle, stepCount, frequency, fileData } = body;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    if (!email || !filename || !fileData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "paste_your_resend_api_key_here"
    ) {
      console.log(`[workflow-builder-email] Mock send to: ${email} | File: ${filename}`);
      return NextResponse.json({ success: true, mock: true });
    }

    await Promise.all([
      addContactToAudience(email),
      sendWorkflowEmail(email, filename, taskTitle, stepCount, frequency, fileData),
    ]);

    logToolUsage(email, "workflow", ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AGENT: Workflow Email API error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
