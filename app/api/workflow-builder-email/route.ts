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

interface ResultItem {
  label: string;
  detail: string;
}

interface ResultSection {
  title: string;
  content: string;
  eyebrow?: string;
  items?: ResultItem[];
}

interface WorkflowEmailBody {
  email: string;
  filename: string;
  taskTitle: string;
  stepCount: string;
  frequency: string;
  fileData: string; // base64-encoded .docx
  sections?: ResultSection[];
}

// ─── Section rendering helpers ───────────────────────────────────────────────

/** Email-safe equivalent of the website's renderContentLines(). Bolds "Tool:" and "Prompt:" prefixes (S155 F24). */
const HIGHLIGHT_PREFIXES = ["Tool:", "Prompt:"];

function renderContentLineHTML(line: string): string {
  const escaped = escapeHTML(line);
  for (const prefix of HIGHLIGHT_PREFIXES) {
    if (line.startsWith(prefix)) {
      return `<strong style="color:#161618;">${escapeHTML(prefix)}</strong>${escapeHTML(line.slice(prefix.length))}`;
    }
  }
  return escaped;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render a content string as HTML paragraphs, splitting on double newlines and rendering lines within each paragraph. */
function renderContentHTML(content: string): string {
  return content
    .split("\n\n")
    .map((para) => {
      const lines = para.split("\n").map(renderContentLineHTML).join("<br/>");
      return `<p style="font-size:14px; line-height:1.7; color:#555553; margin:0 0 12px;">${lines}</p>`;
    })
    .join("");
}

/** Render structured sub-items (prompts, time estimates, AI setup) as a list with dividers.
 *  When isPromptSection is true, detail text renders in monospace on a darker background
 *  to match Prompts email treatment (copy-paste prompt text). */
function renderItemsHTML(items: ResultItem[], isPromptSection = false): string {
  return items
    .map((item, i) => {
      const borderTop = i > 0 ? "border-top:1px solid #e4e4e2; padding-top:12px; margin-top:12px;" : "";
      const detailStyle = isPromptSection
        ? "font-size:13px; line-height:1.65; color:#555553; margin:0; font-family:monospace; background:#eeeeed; border-radius:6px; padding:10px 12px;"
        : "font-size:14px; line-height:1.7; color:#555553; margin:0; white-space:pre-line;";
      return `
        <div style="${borderTop}">
          <p style="font-size:14px; font-weight:600; color:#333331; margin:0 0 4px;">${escapeHTML(item.label)}</p>
          <p style="${detailStyle}">${escapeHTML(item.detail)}</p>
        </div>`;
    })
    .join("");
}

/** Build a single section card HTML block matching the website's individual card pattern (S155 F22-F23). */
function buildSectionCardHTML(section: ResultSection, isFirst: boolean): string {
  const eyebrowHTML = section.eyebrow
    ? `<p style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600; letter-spacing:0.06em; color:#1e7ab8; text-transform:uppercase; margin:0 0 8px;">${escapeHTML(section.eyebrow)}</p>`
    : "";

  const titleHTML = `<h3 style="font-family:Georgia,serif; font-size:20px; font-weight:400; color:#161618; margin:0 0 12px; line-height:1.25; letter-spacing:-0.025em;">${escapeHTML(section.title)}.</h3>`;

  const contentHTML = section.content ? renderContentHTML(section.content) : "";

  // Prompt items get monospace treatment matching Prompts email gold standard (S158)
  const isPromptSection = section.eyebrow === "Prompts";
  const itemsHTML = section.items && section.items.length > 0
    ? `<div style="margin-top:${section.content ? "12px" : "0"}; padding-top:${section.content ? "12px" : "0"}; ${section.content ? "border-top:1px solid #e4e4e2;" : ""}">${renderItemsHTML(section.items, isPromptSection)}</div>`
    : "";

  // Section divider: border-top on every card except the first (matches website pattern S155 F25)
  const dividerStyle = !isFirst ? "border-top:1px solid #e4e4e2; padding-top:24px; margin-top:24px;" : "";

  return `
    <div style="${dividerStyle}">
      ${eyebrowHTML}
      ${titleHTML}
      <div style="background:#f8f8f6; border:1px solid #e4e4e2; border-radius:10px; padding:20px;">
        ${contentHTML}
        ${itemsHTML}
      </div>
    </div>`;
}

/** Build all section cards from the sections array. */
function buildAllSectionsHTML(sections: ResultSection[]): string {
  return sections.map((s, i) => buildSectionCardHTML(s, i === 0)).join("");
}

// ─── Email builder ────────────────────────────────────────────────────────────

async function sendWorkflowEmail(
  email: string,
  filename: string,
  taskTitle: string,
  stepCount: string,
  frequency: string,
  fileData: string,
  sections: ResultSection[]
): Promise<void> {
  const cleanTitle = stripEmDashes(taskTitle);

  // Build sections HTML (matches website results format: individual cards with eyebrows, highlighted prefixes, dividers)
  const sectionsHTML = sections.length > 0 ? buildAllSectionsHTML(sections) : "";

  const heroContent = `
    <h1 style="margin:0 0 24px 0; font-family:Georgia,serif; font-size:28px; font-weight:700; color:#161618; line-height:1.15; letter-spacing:-0.025em;">
      Your workflow is ready.
    </h1>

    ${sectionsHTML}

    <!-- CTA -->
    <div style="margin-top:24px; text-align:center;">
      <a href="https://promptaiagents.com/workflow"
         style="display:inline-block; background:#1e7ab8; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:8px;">
        Build another workflow
      </a>
    </div>

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
    const { email, filename, taskTitle, stepCount, frequency, fileData, sections } = body;
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
      sendWorkflowEmail(email, filename, taskTitle, stepCount, frequency, fileData, sections || []),
    ]);

    logToolUsage(email, "workflow", ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AGENT: Workflow Email API error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
