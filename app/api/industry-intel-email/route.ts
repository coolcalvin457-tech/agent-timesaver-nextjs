import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // .docx generation + Resend delivery

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  BorderStyle,
  UnderlineType,
} from "docx";
import {
  buildBaseEmailHTML,
  buildCrossSellBlockHTML,
  getFromAddress,
  addContactToAudience,
  RESEND_API,
} from "@/app/api/_shared/emailBase";
import { stripEmDashes } from "@/app/api/_shared/sanitize";
import type { IndustryIntelData, IntelSource } from "@/app/api/industry-intel/route";
import { logToolUsage } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailRequestBody {
  email: string;
  jobTitle: string;
  companyName?: string;
  industry: string;
  focusArea: string;
  intelData: IndustryIntelData;
}

// ─── Docx helpers (matches OKB pattern) ──────────────────────────────────────

function sectionLabel(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text, font: "Calibri", size: 18, bold: true, color: "1E7AB8", allCaps: true }),
    ],
    spacing: { before: 0, after: 200 },
  });
}

function h1(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text, font: "Garamond", size: 36, bold: true, color: "161618" }),
    ],
    spacing: { before: 0, after: 160 },
  });
}

function divider(): Paragraph {
  return new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E4E4E2" } },
    spacing: { before: 80, after: 160 },
  });
}

function bodyPara(text: string, muted = false): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text, font: "Calibri", size: 22, color: muted ? "555555" : "333333" }),
    ],
    spacing: { after: 120 },
  });
}

function spacer(): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 80 } });
}

function sourceLink(source: IntelSource): Paragraph {
  return new Paragraph({
    children: [
      new ExternalHyperlink({
        link: source.url,
        children: [
          new TextRun({
            text: source.title,
            font: "Calibri",
            size: 22,
            color: "1E7AB8",
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
      }),
    ],
    spacing: { after: 80 },
  });
}

// ─── Build .docx ──────────────────────────────────────────────────────────────

async function buildDocxFile(
  intelData: IndustryIntelData,
  jobTitle: string,
  industry: string,
  focusArea: string
): Promise<Buffer> {
  const children: Paragraph[] = [];

  // ── Document header ──────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `AGENT: Industry  ·  ${industry}  ·  ${jobTitle}`,
          font: "Calibri",
          size: 18,
          bold: true,
          color: "1E7AB8",
          allCaps: true,
        }),
      ],
      spacing: { before: 0, after: 200 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Focus: ${focusArea}`,
          font: "Calibri",
          size: 18,
          color: "888888",
        }),
      ],
      spacing: { before: 0, after: 320 },
    })
  );

  // ── Section 1: The Insight ────────────────────────────────────────
  children.push(sectionLabel("The Insight"));
  children.push(h1("What's happening right now."));
  children.push(divider());
  intelData.insight.split(/\n\n/).filter(Boolean).forEach((para) => {
    children.push(bodyPara(para.trim()));
    children.push(spacer());
  });

  // ── Section 2: The Connection ─────────────────────────────────────
  children.push(sectionLabel("The Connection"));
  children.push(h1("How this affects your role."));
  children.push(divider());
  intelData.connection.split(/\n\n/).filter(Boolean).forEach((para) => {
    children.push(bodyPara(para.trim()));
    children.push(spacer());
  });

  // ── Section 3: The Strategy ───────────────────────────────────────
  children.push(sectionLabel("The Strategy"));
  children.push(h1("Questions worth raising."));
  children.push(divider());
  intelData.strategy.forEach((question) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "\u2022  ", font: "Calibri", size: 22, color: "1E7AB8" }),
          new TextRun({ text: question, font: "Calibri", size: 22, color: "333333" }),
        ],
        indent: { left: 400, hanging: 0 },
        spacing: { after: 100 },
      })
    );
  });
  children.push(spacer());

  // ── Section 4: The Sources ────────────────────────────────────────
  children.push(sectionLabel("The Sources"));
  children.push(h1("Where this came from."));
  children.push(divider());
  intelData.sources.forEach((source) => {
    children.push(sourceLink(source));
  });

  // ── Footer note ───────────────────────────────────────────────────
  children.push(spacer());
  children.push(divider());
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Built with AGENT: Industry at promptaiagents.com. Built for real jobs. Not demos.`,
          font: "Calibri",
          size: 18,
          color: "AAAAAA",
          italics: true,
        }),
      ],
      spacing: { before: 0, after: 0 },
    })
  );

  const doc = new Document({
    creator: "promptaiagents.com",
    title: `AGENT: Industry: ${industry} · ${jobTitle}`,
    description: `Industry intel for ${jobTitle} in ${industry}. Focus: ${focusArea}.`,
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: "333333" } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ─── Build email HTML ─────────────────────────────────────────────────────────

function buildIntelEmailHTML(
  intelData: IndustryIntelData,
  jobTitle: string,
  industry: string,
  focusArea: string
): string {
  const insightParas = intelData.insight
    .split(/\n\n/)
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px 0; font-size:15px; color:#333333; line-height:1.65;">${p.trim()}</p>`)
    .join("");

  const connectionParas = intelData.connection
    .split(/\n\n/)
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px 0; font-size:15px; color:#333333; line-height:1.65;">${p.trim()}</p>`)
    .join("");

  const strategyQuestions = intelData.strategy
    .map((q) => `<li style="margin:0 0 10px 0; font-size:15px; color:#333333; line-height:1.6;">${q}</li>`)
    .join("");

  const sourcesLinks = intelData.sources
    .map((s) => `<li style="margin:0 0 8px 0;"><a href="${s.url}" style="font-size:14px; color:#1e7ab8; text-decoration:underline;">${s.title}</a></li>`)
    .join("");

  const heroContent = `
    <!-- Subtitle -->
    <p style="margin:0 0 4px 0; font-size:13px; font-family:monospace; letter-spacing:0.04em; color:#888886; text-transform:uppercase;">${industry} · ${jobTitle}</p>
    <p style="margin:0 0 32px 0; font-size:13px; color:#888886;">Focus: ${focusArea}</p>

    <!-- Section 1: The Insight -->
    <p style="margin:0 0 6px 0; font-size:11px; font-weight:700; letter-spacing:0.08em; color:#1e7ab8; text-transform:uppercase; font-family:monospace;">The Insight</p>
    <h2 style="margin:0 0 16px 0; font-size:22px; font-weight:600; color:#161618; line-height:1.2;">What's happening right now.</h2>
    ${insightParas}

    <hr style="border:none; border-top:1px solid #e4e4e2; margin:28px 0;" />

    <!-- Section 2: The Connection -->
    <p style="margin:0 0 6px 0; font-size:11px; font-weight:700; letter-spacing:0.08em; color:#1e7ab8; text-transform:uppercase; font-family:monospace;">The Connection</p>
    <h2 style="margin:0 0 16px 0; font-size:22px; font-weight:600; color:#161618; line-height:1.2;">How this affects your role.</h2>
    ${connectionParas}

    <hr style="border:none; border-top:1px solid #e4e4e2; margin:28px 0;" />

    <!-- Section 3: The Strategy -->
    <p style="margin:0 0 6px 0; font-size:11px; font-weight:700; letter-spacing:0.08em; color:#1e7ab8; text-transform:uppercase; font-family:monospace;">The Strategy</p>
    <h2 style="margin:0 0 16px 0; font-size:22px; font-weight:600; color:#161618; line-height:1.2;">Questions worth raising.</h2>
    <ul style="margin:0 0 8px 0; padding-left:20px;">
      ${strategyQuestions}
    </ul>

    <hr style="border:none; border-top:1px solid #e4e4e2; margin:28px 0;" />

    <!-- Section 4: The Sources -->
    <p style="margin:0 0 6px 0; font-size:11px; font-weight:700; letter-spacing:0.08em; color:#1e7ab8; text-transform:uppercase; font-family:monospace;">The Sources</p>
    <h2 style="margin:0 0 12px 0; font-size:22px; font-weight:600; color:#161618; line-height:1.2;">Where this came from.</h2>
    <ul style="margin:0; padding-left:20px;">
      ${sourcesLinks}
    </ul>

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

  return buildBaseEmailHTML({
    preHeaderText: `Industry intel on ${industry} for ${jobTitle}.`,
    eyebrowLabel: "AGENT: Industry",
    heroContent,
  });
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as EmailRequestBody;
    const { email, jobTitle, companyName: _companyName, industry, focusArea, intelData } = body;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    if (!email?.trim() || !intelData || !industry || !jobTitle || !focusArea) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Server-side em dash strip before docx/email generation
    intelData.insight = stripEmDashes(intelData.insight);
    intelData.connection = stripEmDashes(intelData.connection);
    intelData.strategy = intelData.strategy.map(stripEmDashes);

    // Build docx once — used for both browser download and email attachment
    const docxBuffer = await buildDocxFile(intelData, jobTitle, industry, focusArea);
    const safeIndustry = industry.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const filename = `industry-intel-${safeIndustry}.docx`;

    // Fire email in background — don't block file download response
    const emailHTML = buildIntelEmailHTML(intelData, jobTitle, industry, focusArea);
    const docxBase64 = Buffer.from(docxBuffer).toString("base64");

    Promise.all([
      fetch(`${RESEND_API}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: getFromAddress(),
          to: [email.trim()],
          subject: "AGENT: INDUSTRY",
          html: emailHTML,
          attachments: [{ filename, content: docxBase64 }],
        }),
      }).catch((err) => console.error("Resend error:", err)),
      addContactToAudience(email.trim()).catch(() => {}),
      logToolUsage(email.trim(), "industry", ip),
    ]);

    // Return docx for browser download immediately
    const fileBlob = new Blob([new Uint8Array(docxBuffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return new Response(fileBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Intel-Filename": encodeURIComponent(filename),
      },
    });
  } catch (error) {
    console.error("AGENT: Industry email route error:", error);
    return NextResponse.json(
      { error: "Something went wrong delivering your intel. Please try again." },
      { status: 500 }
    );
  }
}
