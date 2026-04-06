import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
} from "docx";
import { cleanJsonResponse } from "../_shared/cleanJson";

export const maxDuration = 300; // Vercel Pro max; adaptive thinking can exceed 120s

// ─── Types ────────────────────────────────────────────────────────────────────

interface PIPSection {
  heading: string;
  description: string;
}

interface PIPData {
  employeeInfo: {
    name?: string;
    role: string;
    department: string;
    tenure: string;
    managerName: string;
    planDuration: string;
    startDatePlaceholder: string;
    endDatePlaceholder: string;
  };
  openingStatement: string;
  performanceDeficiencies: PIPSection[];
  improvementTargets: PIPSection[];
  supportOffered: {
    description: string;
    eapLine?: string;
  };
  checkinSchedule: string;
  consequences: string;
  signatureBlock: {
    employeeLabel: string;
    employeeDateLabel: string;
    managerLabel: string;
    managerDateLabel: string;
    hrLabel: string;
    hrDateLabel: string;
  };
}

// ─── Input type ───────────────────────────────────────────────────────────────

interface PIPInput {
  employeeName?: string;
  employeeRole: string;
  department: string;
  tenure: string;
  managerName: string;
  issueType: "performance" | "behavioral";
  priorCoaching: boolean;
  deficiencies: string;
  performanceStandard?: string;
  improvementTargets: string;
  timeline: "30" | "60" | "90";
  startDate?: string;
  checkinSchedule: "weekly" | "biweekly" | "custom";
  checkinCustom?: string;
  supportOffered?: string;
  consequences: string;
  includeEAP: boolean;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDateStr(dateStr: string): string {
  // dateStr is YYYY-MM-DD from the date input
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function addDaysToDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day + days);
  return d.toISOString().split("T")[0];
}

// ─── Claude API Call ──────────────────────────────────────────────────────────

async function generatePIP(input: PIPInput): Promise<PIPData> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const priorCoachingLine = input.priorCoaching
    ? "This PIP is issued following prior coaching and feedback conversations. Reference that prior coaching has occurred and this plan formalizes the next step."
    : "This is the first formal documentation of the concerns below. Frame it as the first formal step, not a continuation.";

  const issueTypeGuidance = input.issueType === "behavioral"
    ? "Issue type: BEHAVIORAL. Use incident-based language only. No character judgments (never 'bad attitude', 'difficult to work with'). Reframe personality observations as specific observable incidents. Be especially careful that no line could be read as a character judgment. If the input is vague, use placeholder brackets like [specific incident: date and description] to signal where the HR professional needs to add specifics before issuing."
    : "Issue type: PERFORMANCE. Use clinical, metric-focused language. Reference dates, frequencies, and measurements where provided. Every deficiency must be documentable and measurable.";

  const standardSection = input.performanceStandard?.trim()
    ? `\nDocumented performance standard: ${input.performanceStandard.trim()}`
    : "\nNo documented performance standard was provided. Write the deficiencies section using the information given, without fabricating a specific policy reference.";

  const supportSection = input.supportOffered?.trim()
    ? `Support being offered: ${input.supportOffered.trim()}`
    : "No support detail was provided. Write a minimal but legally defensible support paragraph: at minimum, that the manager is available for scheduled check-in meetings to discuss progress and provide guidance during this period.";

  const checkinText = input.checkinSchedule === "custom" && input.checkinCustom?.trim()
    ? input.checkinCustom.trim()
    : input.checkinSchedule === "biweekly"
    ? "bi-weekly"
    : "weekly";

  const eapInstruction = input.includeEAP
    ? 'Include the EAP line in supportOffered.eapLine: "You are encouraged to utilize the company\'s Employee Assistance Program (EAP) as a confidential resource for personal support during this time."'
    : "Do NOT include an EAP reference. Set supportOffered.eapLine to an empty string.";

  const systemPrompt = `You are a senior HR professional who has written hundreds of Performance Improvement Plans. Your goal is to produce a document that holds up: legally, professionally, and in a room with an employment attorney.

Before writing any section, do a grounding pass on the inputs:
- What is the specific role and department? What does this person actually own day-to-day?
- What exact deficiencies were described? Pull out specific metrics, dates, and frequencies.
- Are the improvement targets measurable (performance) or observable (behavioral)? Write accordingly.
- What did the company offer in terms of support? If nothing was provided, you must write a minimal but legally defensible version.

Core principles:
- Write only what was provided as input. Never fabricate incidents, dates, or measurements.
- If input is too vague to write into, use placeholder brackets: [specific date and incident] — this signals the HR professional to add specifics before issuing.
- The framework is the output. The judgment (whether to issue, whether to terminate) belongs to the HR professional.
- Every sentence in the deficiencies section must describe something observable or measurable, not a character trait.
- The consequences section must be unambiguous. Never soften language to the point of removing clarity.
- "...up to and including termination of employment" should appear if the HR professional provided it.
- The support section must never be empty. At minimum, write: "Your manager, [Name], is available for [cadence] check-in meetings to discuss progress and provide guidance during this period."

Tone calibration:
- Performance PIP: clinical, metric-focused, matter-of-fact. Reference dates, frequencies, and measurements wherever provided.
- Behavioral PIP: careful with language, incident-based only. No personality judgments. "Has a bad attitude" becomes "On [date], [specific observable behavior occurred]." Extra scrutiny on every sentence.

Specificity self-check:
After drafting the deficiencies and improvement targets sections, ask: would this read the same for any employee in any department? If yes, it is too generic. Rewrite using the specific role, tools, and context provided.

Punctuation rules:
- Never use em dashes (the — character). Use a period or a colon instead.
- Never use the word "leverage", "unlock", "supercharge", or "automate".
- Every sentence must be grammatically complete.

Return ONLY valid JSON. No explanation text. No markdown. Just the raw JSON object.`;

  const userMessage = `Build a complete Performance Improvement Plan with this information:

Employee role: ${input.employeeRole}
Department: ${input.department}
Tenure: ${input.tenure}
Manager: ${input.managerName}
Plan duration: ${input.timeline} days
${issueTypeGuidance}
${priorCoachingLine}

Specific deficiencies:
${input.deficiencies}
${standardSection}

Improvement targets:
${input.improvementTargets}

${supportSection}

Check-in schedule: ${checkinText}
${eapInstruction}

Consequences if targets not met:
${input.consequences}

Return this exact JSON structure:
{
  "employeeInfo": {
    "role": "${input.employeeRole}",
    "department": "${input.department}",
    "tenure": "${input.tenure}",
    "managerName": "${input.managerName}",
    "planDuration": "${input.timeline}-day",
    "startDatePlaceholder": "[Plan Start Date]",
    "endDatePlaceholder": "[Plan End Date]"
  },
  "openingStatement": "2-3 sentences. Formal but not cold. States the purpose of the PIP clearly: this is a documented framework for improvement, not a punishment. ${input.priorCoaching ? "Reference that prior coaching has occurred." : "Frame as first formal documentation step."} Reference the role and plan duration.",
  "performanceDeficiencies": [
    {
      "heading": "Short descriptive heading for this area of concern (e.g. 'Outbound Call Volume' or 'Client Communication')",
      "description": "Specific, observable, documented description. Measurable language. Dates and frequencies where provided. No character judgments. Use [specific date and incident] placeholder brackets where the input was too vague to write into."
    }
  ],
  "improvementTargets": [
    {
      "heading": "Short heading for this improvement expectation",
      "description": "Specific target with how it will be measured and over what timeframe. Future-oriented: 'The expectation for the ${input.timeline}-day period is...'"
    }
  ],
  "supportOffered": {
    "description": "Paragraph describing what the company is offering. If minimal, write: 'Your manager, ${input.managerName}, is available for ${checkinText} check-in meetings to discuss progress and provide guidance during this period.' Build on any support details provided.",
    "eapLine": ""
  },
  "checkinSchedule": "One paragraph. Describes the ${checkinText} cadence, who conducts check-ins (${input.managerName}), and what will be assessed at each touchpoint.",
  "consequences": "The HR professional's stated consequences, cleaned up for formality. Must be unambiguous. Preserve 'up to and including termination of employment' if provided.",
  "signatureBlock": {
    "employeeLabel": "Employee Signature",
    "employeeDateLabel": "Date",
    "managerLabel": "Manager Signature",
    "managerDateLabel": "Date",
    "hrLabel": "HR Representative Signature",
    "hrDateLabel": "Date"
  }
}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = (message.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");

  return JSON.parse(cleanJsonResponse(text)) as PIPData;
}

// ─── Document helpers ─────────────────────────────────────────────────────────

function h1(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Garamond", size: 36, bold: true, color: "161618" })],
    spacing: { before: 0, after: 160 },
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Garamond", size: 28, bold: true, color: "161618" })],
    spacing: { before: 240, after: 100 },
  });
}

function h3(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 22, bold: true, color: "161618" })],
    spacing: { before: 160, after: 60 },
  });
}

function body(
  text: string,
  options?: { bold?: boolean; italic?: boolean; size?: number; color?: string }
): Paragraph {
  return new Paragraph({
    children: [new TextRun({
      text,
      font: "Calibri",
      size: options?.size ?? 22,
      bold: options?.bold,
      italics: options?.italic,
      color: options?.color ?? "333333",
    })],
    spacing: { after: 100 },
  });
}

function spacer(): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 60 } });
}

function divider(): Paragraph {
  return new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E4E4E2" } },
    spacing: { before: 80, after: 160 },
  });
}

function sectionLabel(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 18, bold: true, color: "1E7AB8", allCaps: true })],
    spacing: { before: 0, after: 200 },
  });
}

// ─── Employee Info Table ──────────────────────────────────────────────────────

function buildInfoTable(info: PIPData["employeeInfo"]): Table {
  const borderStyle = { style: BorderStyle.SINGLE, size: 4, color: "E4E4E2" };
  const cellBorders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
  const headerShading = { type: ShadingType.CLEAR, fill: "F0F0EE" };
  const valueShading = { type: ShadingType.CLEAR, fill: "FFFFFF" };

  function infoRow(label: string, value: string, shading = valueShading): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: label, font: "Calibri", size: 20, bold: true, color: "161618" })], spacing: { after: 60 } })],
          width: { size: 3000, type: WidthType.DXA },
          shading: headerShading,
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: value, font: "Calibri", size: 20, color: "333333" })], spacing: { after: 60 } })],
          width: { size: 6360, type: WidthType.DXA },
          shading,
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
      ],
    });
  }

  const rows = [
    ...(info.name ? [infoRow("Employee Name", info.name, { type: ShadingType.CLEAR, fill: "F8F8F6" })] : []),
    infoRow("Role / Title", info.role),
    infoRow("Department", info.department, { type: ShadingType.CLEAR, fill: "F8F8F6" }),
    infoRow("Tenure", info.tenure),
    infoRow("Manager", info.managerName, { type: ShadingType.CLEAR, fill: "F8F8F6" }),
    infoRow("Plan Duration", info.planDuration),
    infoRow("Plan Start Date", info.startDatePlaceholder, { type: ShadingType.CLEAR, fill: "F8F8F6" }),
    infoRow("Plan End Date", info.endDatePlaceholder),
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows,
  });
}

// ─── Signature Block ──────────────────────────────────────────────────────────

function buildSignatureBlock(sig: PIPData["signatureBlock"]): (Paragraph | Table)[] {
  const items: (Paragraph | Table)[] = [];

  // Force signature block onto its own page so it never gets split across pages
  items.push(new Paragraph({
    children: [new PageBreak()],
    spacing: { before: 0, after: 0 },
  }));
  items.push(h2("Acknowledgment of Receipt"));
  items.push(body(
    "Signing this document confirms receipt of the Performance Improvement Plan and acknowledgment of its contents. It does not indicate agreement with the assessments or conclusions contained herein.",
    { italic: true, color: "555555" }
  ));
  items.push(spacer());

  const borderStyle = { style: BorderStyle.SINGLE, size: 4, color: "E4E4E2" };
  const cellBorders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
  const shading = { type: ShadingType.CLEAR, fill: "FFFFFF" };

  function sigCell(label: string): TableCell {
    return new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: "\u00a0", font: "Calibri", size: 22 })],
          spacing: { after: 40 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "161618" } },
        }),
        new Paragraph({
          children: [new TextRun({ text: label, font: "Calibri", size: 18, color: "888886" })],
          spacing: { after: 0 },
        }),
      ],
      width: { size: 3000, type: WidthType.DXA },
      shading,
      borders: cellBorders,
      margins: { top: 160, bottom: 80, left: 120, right: 120 },
    });
  }

  function dateCell(label: string): TableCell {
    return new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: "\u00a0", font: "Calibri", size: 22 })],
          spacing: { after: 40 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "161618" } },
        }),
        new Paragraph({
          children: [new TextRun({ text: label, font: "Calibri", size: 18, color: "888886" })],
          spacing: { after: 0 },
        }),
      ],
      width: { size: 1120, type: WidthType.DXA },
      shading,
      borders: cellBorders,
      margins: { top: 160, bottom: 80, left: 120, right: 120 },
    });
  }

  // Three rows: employee, manager, HR
  const sigPairs: Array<{ sigLabel: string; dateLabel: string }> = [
    { sigLabel: sig.employeeLabel, dateLabel: sig.employeeDateLabel },
    { sigLabel: sig.managerLabel, dateLabel: sig.managerDateLabel },
    { sigLabel: sig.hrLabel, dateLabel: sig.hrDateLabel },
  ];

  for (const pair of sigPairs) {
    items.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 5240, 1120],
      rows: [
        new TableRow({
          children: [
            sigCell(pair.sigLabel),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
              width: { size: 5240, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
              borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
            }),
            dateCell(pair.dateLabel),
          ],
        }),
      ],
    }));
    items.push(spacer());
  }

  return items;
}

// ─── Build .docx File ─────────────────────────────────────────────────────────

async function buildDocxFile(pip: PIPData): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // ── Document Title ────────────────────────────────────────────
  children.push(sectionLabel("HR Agents Package"));
  children.push(h1("Performance Improvement Plan"));
  children.push(divider());

  // ── Employee Information Table ────────────────────────────────
  children.push(h2("Employee Information"));
  children.push(spacer());
  children.push(buildInfoTable(pip.employeeInfo));
  children.push(spacer());

  // ── Opening Statement ─────────────────────────────────────────
  children.push(h2("Opening Statement"));
  children.push(divider());
  children.push(body(pip.openingStatement));
  children.push(spacer());

  // ── Performance Deficiencies ──────────────────────────────────
  children.push(h2("Performance Deficiencies"));
  children.push(divider());
  children.push(body(
    "The following areas have been identified as not meeting the performance standards expected for this role.",
    { italic: true, color: "555555" }
  ));
  children.push(spacer());

  for (const def of pip.performanceDeficiencies) {
    children.push(h3(def.heading));
    children.push(body(def.description));
    children.push(spacer());
  }

  // ── Improvement Targets ───────────────────────────────────────
  children.push(h2("Improvement Targets"));
  children.push(divider());
  children.push(body(
    `The following targets must be met within the ${pip.employeeInfo.planDuration} plan period to demonstrate satisfactory improvement.`,
    { italic: true, color: "555555" }
  ));
  children.push(spacer());

  for (const target of pip.improvementTargets) {
    children.push(h3(target.heading));
    children.push(body(target.description));
    children.push(spacer());
  }

  // ── Support and Resources ─────────────────────────────────────
  children.push(h2("Support and Resources"));
  children.push(divider());
  children.push(body(pip.supportOffered.description));
  if (pip.supportOffered.eapLine) {
    children.push(spacer());
    children.push(body(pip.supportOffered.eapLine));
  }
  children.push(spacer());

  // ── Check-in Schedule ─────────────────────────────────────────
  children.push(h2("Check-in Schedule"));
  children.push(divider());
  children.push(body(pip.checkinSchedule));
  children.push(spacer());

  // ── Consequences If Targets Are Not Met ──────────────────────
  children.push(h2("Consequences If Targets Are Not Met"));
  children.push(divider());
  children.push(body(pip.consequences));
  children.push(spacer());

  // ── Signature Block ───────────────────────────────────────────
  const sigItems = buildSignatureBlock(pip.signatureBlock);
  children.push(...sigItems);

  // ── Legal Disclaimer (hardcoded — never generated by Claude) ──
  children.push(divider());
  children.push(body(
    "This document is not legal advice. Consult your employment attorney for jurisdiction-specific guidance before issuing.",
    { color: "AAAAAA", size: 18, italic: true }
  ));

  const doc = new Document({
    creator: "promptaiagents.com",
    title: `Performance Improvement Plan: ${pip.employeeInfo.role}`,
    description: `${pip.employeeInfo.planDuration} Performance Improvement Plan for ${pip.employeeInfo.role}, ${pip.employeeInfo.department}`,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: "333333" },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 }, // US Letter
            margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const input = await req.json() as PIPInput;

    // Validation
    if (!input.employeeRole?.trim() || !input.department?.trim() || !input.managerName?.trim()) {
      return NextResponse.json({ error: "Role, department, and manager name are required." }, { status: 400 });
    }
    if (!input.deficiencies?.trim() || input.deficiencies.trim().length < 80) {
      return NextResponse.json({ error: "Please provide more detail in the deficiencies field." }, { status: 400 });
    }
    if (!input.improvementTargets?.trim() || input.improvementTargets.trim().length < 50) {
      return NextResponse.json({ error: "Please provide more detail in the improvement targets field." }, { status: 400 });
    }
    if (!input.consequences?.trim()) {
      return NextResponse.json({ error: "Please describe the consequences if targets are not met." }, { status: 400 });
    }

    let pipData: PIPData;

    if (!process.env.ANTHROPIC_API_KEY) {
      // Mock data for local development without API key
      pipData = {
        employeeInfo: {
          role: input.employeeRole,
          department: input.department,
          tenure: input.tenure,
          managerName: input.managerName,
          planDuration: `${input.timeline}-day`,
          startDatePlaceholder: "[Plan Start Date]",
          endDatePlaceholder: `[Plan End Date — ${input.timeline} days from start]`,
        },
        openingStatement: `This Performance Improvement Plan is issued to the ${input.employeeRole} in the ${input.department} department. The purpose of this plan is to provide a clear, structured framework for improvement and to document the expectations and support offered during the ${input.timeline}-day plan period.`,
        performanceDeficiencies: [
          { heading: "Performance Gap", description: input.deficiencies },
        ],
        improvementTargets: [
          { heading: "Improvement Expectation", description: input.improvementTargets },
        ],
        supportOffered: {
          description: input.supportOffered?.trim() || `Your manager, ${input.managerName}, is available for check-in meetings to discuss progress and provide guidance during this period.`,
          eapLine: input.includeEAP ? "You are encouraged to utilize the company's Employee Assistance Program (EAP) as a confidential resource for personal support during this time." : "",
        },
        checkinSchedule: `Check-in meetings will be conducted ${input.checkinSchedule === "custom" ? input.checkinCustom ?? "regularly" : input.checkinSchedule} with ${input.managerName}. Each meeting will review progress against the targets outlined in this plan.`,
        consequences: input.consequences,
        signatureBlock: {
          employeeLabel: "Employee Signature",
          employeeDateLabel: "Date",
          managerLabel: "Manager Signature",
          managerDateLabel: "Date",
          hrLabel: "HR Representative Signature",
          hrDateLabel: "Date",
        },
      };
    } else {
      try {
        pipData = await generatePIP(input);
      } catch (firstErr) {
        // Retry once on JSON parse failure with assistant prefill to nudge valid JSON
        if (firstErr instanceof SyntaxError || (firstErr instanceof Error && firstErr.message.includes("No JSON found"))) {
          console.warn("[pip-builder] First attempt failed, retrying with assistant prefill:", firstErr instanceof Error ? firstErr.message : String(firstErr));
          const Anthropic = (await import("@anthropic-ai/sdk")).default;
          const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const retryMsg = await (client.messages.create as any)({
            model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
            max_tokens: 16000,
            thinking: { type: "adaptive" },
            system: "You are a senior HR professional. Return ONLY valid JSON. No explanation text. No markdown.",
            messages: [
              { role: "user", content: "Return the performance improvement plan as valid JSON. Start with {" },
              { role: "assistant", content: "{" },
            ],
          });
          const retryText = (retryMsg.content as Array<{ type: string; text?: string }>)
            .filter((block: { type: string }) => block.type === "text")
            .map((block: { text?: string }) => block.text!)
            .join("");
          pipData = JSON.parse(cleanJsonResponse("{" + retryText)) as PIPData;
        } else {
          throw firstErr;
        }
      }
    }

    // ── Overlay factual fields from user input ────────────────
    // Employee name and start/end dates are factual inputs — override whatever
    // the AI or mock path generated with the exact values the user provided.
    if (input.employeeName?.trim()) {
      pipData.employeeInfo.name = input.employeeName.trim();
    }
    if (input.startDate?.trim()) {
      pipData.employeeInfo.startDatePlaceholder = formatDateStr(input.startDate);
      pipData.employeeInfo.endDatePlaceholder = formatDateStr(
        addDaysToDate(input.startDate, parseInt(input.timeline))
      );
    }

    const docxBuffer = await buildDocxFile(pipData);
    const safeRole = input.employeeRole.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().replace(/-+/g, "-");
    const filename = `pip-${safeRole}-${input.timeline}day.docx`;

    const fileBlob = new Blob([new Uint8Array(docxBuffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return new Response(fileBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-PIP-Filename": encodeURIComponent(filename),
        "X-Employee-Role": encodeURIComponent(input.employeeRole),
        "X-Timeline": input.timeline,
      },
    });
  } catch (error) {
    console.error("AGENT: PIP API error:", error);
    return NextResponse.json(
      { error: "Something went wrong building the document. Your inputs are saved. Try again and it should work." },
      { status: 500 }
    );
  }
}
