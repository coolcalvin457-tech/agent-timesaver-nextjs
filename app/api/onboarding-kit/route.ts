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
  PageBreak,
  BorderStyle,
  ShadingType,
} from "docx";

export const maxDuration = 300; // Vercel Pro max; adaptive thinking can exceed 120s

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeyContact {
  name: string;
  title: string;
  email?: string;
  why: string;
}

interface OnboardingKitData {
  welcomeLetter: {
    subject: string;
    body: string; // multi-paragraph, separated by \n\n
  };
  firstWeekSchedule: Array<{
    day: string;
    items: string[];
  }>;
  keyContacts: KeyContact[];
  roleExpectations: {
    overview: string;
    day30: string[];
    day60: string[];
    day90: string[];
  };
  newHireChecklist: {
    preStart: string[];
    dayOne: string[];
    weekOne: string[];
    monthOne: string[];
  };
}

// ─── Mock fallback ─────────────────────────────────────────────────────────────

const MOCK_KIT: OnboardingKitData = {
  welcomeLetter: {
    subject: "Welcome to the team, Jordan.",
    body: "We've been building toward this hire for a while, and we're glad you're finally here. You were brought on to build something that didn't exist before: the top-of-funnel function for our outbound motion. That's a real mandate, and we're giving you the space and the support to do it right.\n\nYour first week is intentionally lighter. You'll meet the team, get access to everything you need, and start understanding how we operate. There's no expectation to produce anything in week one. The expectation is to listen, ask questions, and build relationships.\n\nAt 30 days, we'll want to see your first prospecting list. At 60, your first outbound sequence live. At 90, pipeline contribution visible in HubSpot. These are milestones, not ceilings. We're excited to see where you take it.\n\nWelcome. Ask anything. We're glad you're here.\n\nSarah Chen",
  },
  firstWeekSchedule: [
    {
      day: "Day 1: Monday, April 7",
      items: [
        "9:00 AM: Office orientation and badge access with HR",
        "10:00 AM: Welcome meeting with your manager, Sarah Chen",
        "12:00 PM: Welcome lunch with the marketing team",
        "2:00 PM: System access setup. HubSpot, Slack, Google Drive, Zoom",
        "4:00 PM: Review first-week priorities with Sarah",
      ],
    },
    {
      day: "Day 2: Tuesday, April 8",
      items: [
        "9:00 AM: 1:1 with Sarah to align on 30-day expectations",
        "11:00 AM: Introduction to the sales team",
        "1:00 PM: HubSpot walkthrough with sales ops",
        "3:00 PM: Review existing outbound materials and past campaigns",
      ],
    },
    {
      day: "Day 3: Wednesday, April 9",
      items: [
        "9:30 AM: Shadow two customer discovery calls",
        "1:00 PM: Independent review time. Accounts, pipeline, team notes",
        "3:00 PM: Debrief with Sarah on discovery call observations",
        "4:30 PM: Begin building first prospecting list outline",
      ],
    },
    {
      day: "Day 4: Thursday, April 10",
      items: [
        "10:00 AM: Meet with key cross-functional contacts",
        "1:00 PM: Continue prospecting list research",
        "3:00 PM: Weekly team standup",
        "4:30 PM: Async reading time. Product docs, ICP profiles, competitor notes",
      ],
    },
    {
      day: "Day 5: Friday, April 11",
      items: [
        "10:00 AM: End-of-week check-in with Sarah",
        "11:00 AM: Share first-week observations and questions",
        "1:00 PM: Unstructured time to wrap up notes and prep for week two",
        "3:00 PM: Optional: introduce yourself to any team members you haven't met yet",
      ],
    },
  ],
  keyContacts: [
    {
      name: "Sarah Chen",
      title: "VP Marketing",
      why: "Your manager. Primary resource for priorities, direction, and weekly feedback.",
    },
    {
      name: "Marcus Webb",
      title: "Head of Sales",
      why: "Your closest partner. Owns the pipeline that your outbound work feeds into.",
    },
    {
      name: "Priya Nair",
      title: "HR Generalist",
      why: "Your HR contact for benefits, policies, and anything administrative.",
    },
  ],
  roleExpectations: {
    overview:
      "The first 90 days are about building context and making your first visible contribution. The goal is not to prove you belong. It's to understand how things work and then start shaping them.",
    day30: [
      "Complete full orientation: tools, team, and key accounts",
      "Understand how deals currently move through the pipeline",
      "Deliver first prospecting list for review with Sarah",
    ],
    day60: [
      "First outbound sequence designed and live",
      "Initial response data reviewed and sequence iterated",
      "Strong working relationship with sales team established",
    ],
    day90: [
      "Pipeline contribution visible in HubSpot",
      "Outbound playbook first draft complete",
      "30-day roadmap for Q2 presented to marketing team",
    ],
  },
  newHireChecklist: {
    preStart: [
      "Complete I-9 documentation",
      "Return signed offer letter",
      "Confirm system access setup with IT (HubSpot, Slack, Google Drive, Zoom)",
      "Review and sign employee handbook",
      "Set up direct deposit through HR portal",
    ],
    dayOne: [
      "Get badge access from building security",
      "Log into all assigned systems and verify access",
      "Attend welcome meeting with manager",
      "Save key contacts in your phone and Slack",
      "Read through first-week schedule",
    ],
    weekOne: [
      "Meet all key contacts listed in this kit",
      "Shadow at least two customer calls",
      "Get a walkthrough of HubSpot from sales ops",
      "Review all available outbound materials and past campaigns",
      "Have end-of-week check-in with manager",
    ],
    monthOne: [
      "Complete 30-day check-in with HR",
      "Deliver first prospecting list to manager",
      "Complete any required compliance or onboarding trainings",
      "Review 30-day expectations with manager and confirm on track",
      "Share one observation or recommendation with the team",
    ],
  },
};

// ─── File Parser ─────────────────────────────────────────────────────────────

async function parseContextFile(file: File): Promise<string> {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");

  // Plain text — no dependencies needed
  if (ext === ".txt" || ext === ".md") {
    try {
      const text = await file.text();
      return text.slice(0, 8000);
    } catch {
      return "";
    }
  }

  // .docx — extract raw text with mammoth
  if (ext === ".docx") {
    try {
      const mammoth = (await import("mammoth")).default;
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, 8000);
    } catch {
      return ""; // parsing failed — continue without context
    }
  }

  // .pdf — extract text with pdf-parse
  if (ext === ".pdf") {
    try {
      const pdfModule = await import("pdf-parse");
      // pdf-parse v2 exports as ESM default; fall back to module itself if no .default
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = (pdfModule as any).default ?? pdfModule;
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdf(buffer);
      return (data.text as string).slice(0, 8000);
    } catch {
      return ""; // parsing failed — continue without context
    }
  }

  return "";
}

// ─── Claude API Call ──────────────────────────────────────────────────────────

async function generateOnboardingKit(
  payload: Record<string, string>,
  fileContext: string
): Promise<OnboardingKitData> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const {
    hireName,
    hireTitle,
    department,
    startDate,
    managerName,
    roleType,
    whyHired,
    weekOnePriorities,
    keyTools,
    howTeamWorks,
    thirtyToNinety,
    keyContacts,
    teamNotes,
    feedbackCadence,
  } = payload;

  const isManager = roleType === "manager";

  const fileSection = fileContext.trim()
    ? `\n\nThe HR professional uploaded an additional reference document (job description or existing onboarding material). Use this as supplementary context. Prioritize it where it adds specificity:\n\n${fileContext.trim()}`
    : "";

  let contactsSection = "";
  try {
    const parsedContacts = JSON.parse(keyContacts || "[]") as Array<{ name: string; title: string }>;
    const filledContacts = parsedContacts.filter((c) => c.name.trim() || c.title.trim());
    if (filledContacts.length > 0) {
      contactsSection = `\nKey contacts provided:\n${filledContacts.map((c) => `- ${c.name} (${c.title})`).join("\n")}`;
    }
  } catch {
    // No contacts parsed — Claude will generate from context
  }

  if (teamNotes.trim()) {
    contactsSection += `\n\nAdditional team context: ${teamNotes.trim()}`;
  }

  const systemPrompt = `You are a senior HR professional who has built hundreds of onboarding kits for high-performing companies. Your job is to create a complete, personalized onboarding kit that looks like it was written by someone who knows this new hire, this role, and this team. Not by a tool.

The kit is a context-building document, not a logistics checklist. The new hire should finish reading it knowing: why they were hired, what success looks like, how the team actually works, and exactly where to go when they're stuck.

Before writing any section, do a grounding pass on the inputs:
- What is the actual job? What does this person own?
- What specific tools, team dynamics, and milestones were provided?
- Would the output for this person look meaningfully different from the output for someone with a different title? If not, it is too generic.

Welcome letter rules:
- Sound human and specific. Never use "we are pleased to have you" or "we look forward to your contributions."
- Reference exactly why this person was hired, using the "why this hire, why now" language directly.
- Paragraph 1: personal welcome, reference why they were hired. Paragraph 2: what week one looks like and who they'll meet. Paragraph 3: what success looks like and why their work matters. Paragraph 4: short, warm closing from the hiring manager.

First-week schedule rules:
- Day 1 and Day 2 must be deliberately lighter: orientation, introductions, system access, relationship-building. Not a sprint to productivity.
- A new hire who arrives and cannot log into their assigned tools on Day 1 interprets that as indifference. System access setup must appear on Day 1.
- Day 3 and 4 build toward first actual work. Day 5 includes a brief end-of-week check-in or reflection with the manager.
- Each day: 4 to 6 items, time-anchored where natural. Items must feel achievable, not overwhelming.

30/60/90 rules:
- Never use generic placeholders like "get up to speed with company processes" or "build relationships with the team." Every milestone must be role-specific.
- IC milestones: individual deliverables, ramp to contribution, first visible output.
- Manager-track milestones: understanding direct reports, running first team meeting, relationship with key stakeholders, observing processes before making changes.
- Open with 1 to 2 sentences framing the first 90 days as context-building and first visible contribution. Not as a test.

Key contacts rules:
- Write from the new hire's perspective: why does this person matter to them specifically?
- Not "X is our VP of Y" but "X owns Y and will be your main connection for Z."
- Use any structured contacts provided. If none were provided, infer 3 to 4 plausible contacts from the role, department, and team context.

Checklist rules:
- Pre-start must always include: complete I-9 documentation, return signed offer letter, confirm system access before Day 1.
- Month One items must ladder directly toward the 30-day milestone from the 30/60/90. The checklist and the role expectations should feel like the same document, not two separate things.
- Day One checklist should feel welcoming, not administrative.

Punctuation rules:
- Never use em dashes (the — character). Use a period or a colon instead.
- Never use the word "leverage", "unlock", "supercharge", or "automate".
- Every sentence must be grammatically complete. Never truncate mid-sentence or mid-thought.

Return ONLY valid JSON. No explanation text. No markdown. Just the raw JSON object.`;

  const userMessage = `Build a complete onboarding kit for this new hire:

Name: ${hireName}
Job title: ${hireTitle}
Department: ${department}
Start date: ${startDate}
Hiring manager: ${managerName}
Role type: ${isManager ? "Manager or team lead" : "Individual contributor"}

Why this hire, why now:
${whyHired}

Week one priorities:
${weekOnePriorities}

Key tools and systems:
${keyTools}

How the team works:
${howTeamWorks}

30/60/90 day expectations:
${thirtyToNinety}

Feedback cadence:
${feedbackCadence || "Weekly 1:1 with manager."}
${contactsSection}${fileSection}

${isManager ? "IMPORTANT: This is a manager-track hire. The 30/60/90 milestones should reference understanding direct reports, running their first team meeting, building relationships with key stakeholders, and observing team processes before making changes." : ""}

Return this exact JSON structure:
{
  "welcomeLetter": {
    "subject": "Welcome to the team, ${hireName}.",
    "body": "3-4 paragraph body text only. Paragraphs separated by \\n\\n. Do NOT include a salutation or sign-off — those are added automatically. Paragraph 1: welcome them personally, reference why they were hired (use the 'why this hire' input directly). Paragraph 2: what their first week looks like and who they'll meet. Paragraph 3: what success looks like and why their work matters to the team. Paragraph 4: short, warm closing from the hiring manager — end on encouragement, not logistics."
  },
  "firstWeekSchedule": [
    {
      "day": "Day 1: Monday, ${startDate}",
      "items": ["time: activity", "time: activity", "time: activity", "time: activity", "time: activity"]
    },
    { "day": "Day 2: [next weekday], [date]", "items": ["...", "...", "...", "..."] },
    { "day": "Day 3: [next weekday], [date]", "items": ["...", "...", "...", "..."] },
    { "day": "Day 4: [next weekday], [date]", "items": ["...", "...", "...", "..."] },
    { "day": "Day 5: [next weekday], [date]", "items": ["...", "...", "...", "..."] }
  ],
  "keyContacts": [
    { "name": "contact name", "title": "job title", "email": "placeholder email in firstname.lastname@company.com format — HR will replace with the real address", "why": "one sentence, practical, from the new hire's perspective. Not 'X is our VP of Y' but 'X owns Y and will be your main connection for Z'" }
  ],
  "roleExpectations": {
    "overview": "1-2 sentences framing the first 90 days as context-building and first visible contribution. Not as a test.",
    "day30": ["milestone 1", "milestone 2", "milestone 3"],
    "day60": ["milestone 1", "milestone 2", "milestone 3"],
    "day90": ["milestone 1", "milestone 2", "milestone 3"]
  },
  "newHireChecklist": {
    "preStart": ["Complete I-9 documentation", "Return signed offer letter", "Confirm system access setup with IT before Day 1", "..."],
    "dayOne": ["Get badge access", "Log into all assigned systems", "..."],
    "weekOne": ["Meet all key contacts listed in this kit", "..."],
    "monthOne": ["Complete 30-day check-in with HR", "30-day review with manager", "..."]
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
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Claude response");

  // Strip any em dashes that slipped through despite the prompt instruction
  // Replace — with a colon (matches the design system rule: use periods or colons, never em dashes)
  const sanitized = jsonMatch[0].replace(/\u2014/g, ":");

  return JSON.parse(sanitized) as OnboardingKitData;
}

// ─── Document Builder ─────────────────────────────────────────────────────────

// Helper: Garamond heading
function h1(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: "Garamond",
        size: 36, // 18pt
        bold: true,
        color: "161618",
      }),
    ],
    spacing: { before: 0, after: 160 },
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: "Garamond",
        size: 28, // 14pt
        bold: true,
        color: "161618",
      }),
    ],
    spacing: { before: 240, after: 100 },
  });
}

// Helper: Calibri body paragraph
function body(
  text: string,
  options?: { bold?: boolean; italic?: boolean; size?: number; color?: string; indent?: boolean }
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: options?.size ?? 22, // 11pt
        bold: options?.bold,
        italics: options?.italic,
        color: options?.color ?? "333333",
      }),
    ],
    indent: options?.indent ? { left: 360 } : undefined,
    spacing: { after: 100 },
  });
}

// Helper: spacer paragraph
function spacer(): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 60 } });
}

// Helper: bullet item
function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: "\u2022  ", font: "Calibri", size: 22, color: "1E7AB8" }),
      new TextRun({ text, font: "Calibri", size: 22, color: "333333" }),
    ],
    indent: { left: 400, hanging: 0 },
    spacing: { after: 80 },
  });
}

// Helper: checkbox item
function checkbox(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: "\u2610  ", font: "Calibri", size: 22, color: "555555" }),
      new TextRun({ text, font: "Calibri", size: 22, color: "333333" }),
    ],
    indent: { left: 400, hanging: 0 },
    spacing: { after: 80 },
  });
}

// Helper: page break
function pageBreak(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

// Helper: horizontal rule (thin line via border)
function divider(): Paragraph {
  return new Paragraph({
    children: [],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "E4E4E2" },
    },
    spacing: { before: 80, after: 160 },
  });
}

// Helper: section label (small caps eyebrow above h1)
function sectionLabel(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: 18, // 9pt
        bold: true,
        color: "1E7AB8",
        allCaps: true,
      }),
    ],
    spacing: { before: 0, after: 200 },
  });
}

// ─── Build Key Contacts Table ─────────────────────────────────────────────────

function buildContactsTable(contacts: KeyContact[]): Table {
  const borderStyle = { style: BorderStyle.SINGLE, size: 4, color: "E4E4E2" };
  const cellBorders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  // Fix: ShadingType.CLEAR (not SOLID) for correct background fill in Google Docs
  const headerShading = { type: ShadingType.CLEAR, fill: "F0F0EE" };

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Name", font: "Calibri", size: 20, bold: true, color: "161618" })],
            spacing: { after: 60 },
          }),
        ],
        width: { size: 2300, type: WidthType.DXA },
        shading: headerShading,
        borders: cellBorders,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Title", font: "Calibri", size: 20, bold: true, color: "161618" })],
            spacing: { after: 60 },
          }),
        ],
        width: { size: 2500, type: WidthType.DXA },
        shading: headerShading,
        borders: cellBorders,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Why They Matter", font: "Calibri", size: 20, bold: true, color: "161618" })],
            spacing: { after: 60 },
          }),
        ],
        width: { size: 4560, type: WidthType.DXA },
        shading: headerShading,
        borders: cellBorders,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
    ],
  });

  const dataRows = contacts.map((contact, i) => {
    // Fix: explicit width on every data cell (not just header cells)
    const rowShading = { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "FFFFFF" : "F8F8F6" };
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: contact.name, font: "Calibri", size: 20, bold: true, color: "161618" })],
              spacing: { after: 40 },
            }),
            ...(contact.email ? [new Paragraph({
              children: [new TextRun({ text: contact.email, font: "Calibri", size: 18, color: "1E7AB8" })],
              spacing: { after: 60 },
            })] : []),
          ],
          width: { size: 2300, type: WidthType.DXA },
          shading: rowShading,
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: contact.title, font: "Calibri", size: 20, italics: true, color: "555555" })],
              spacing: { after: 60 },
            }),
          ],
          width: { size: 2500, type: WidthType.DXA },
          shading: rowShading,
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: contact.why, font: "Calibri", size: 20, color: "333333" })],
              spacing: { after: 60 },
            }),
          ],
          width: { size: 4560, type: WidthType.DXA },
          shading: rowShading,
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
      ],
    });
  });

  // Fix: columnWidths drives the tblGrid element — without this docx generates
  // dummy 100/100/100 values which causes Google Docs to misread column layout
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2300, 2500, 4560],
    rows: [headerRow, ...dataRows],
  });
}

// ─── Build .docx File ─────────────────────────────────────────────────────────

async function buildDocxFile(
  kit: OnboardingKitData,
  hireName: string,
  hireTitle: string,
  managerName: string
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // ── Section 1: Warm Welcome Letter ────────────────────────────────
  children.push(sectionLabel("Warm Welcome Letter"));
  children.push(h1("Welcome to the Team!"));
  children.push(divider());
  children.push(body("We're excited to have you onboard.", { bold: true, size: 24 }));
  children.push(spacer());

  // Salutation
  children.push(body(`Hi ${hireName},`, { size: 22 }));
  children.push(spacer());

  // Split body into paragraphs
  const letterParagraphs = kit.welcomeLetter.body.split(/\n\n/).filter(Boolean);
  letterParagraphs.forEach((para) => {
    children.push(body(para.trim(), { size: 22 }));
    children.push(spacer());
  });

  // Sign-off
  children.push(body("Sincerely,", { size: 22 }));
  children.push(body(managerName, { size: 22 }));
  children.push(spacer());

  children.push(pageBreak());

  // ── Section 2: First-Week Schedule ──────────────────────────
  children.push(sectionLabel("First-Week Schedule"));
  children.push(h1(`${hireName}'s First Week (Tentative)`));
  children.push(divider());

  kit.firstWeekSchedule.forEach((day) => {
    children.push(h2(day.day));
    day.items.forEach((item) => children.push(bullet(item)));
    children.push(spacer());
  });

  children.push(pageBreak());

  // ── Section 3: Key Contacts ──────────────────────────────────
  children.push(sectionLabel("Key Contacts"));
  children.push(h1(`People ${hireName} Should Know First`));
  children.push(divider());
  children.push(
    body(
      `These are the people most important to ${hireName}'s first 90 days. Each person is listed with what they do and why they matter to this role specifically.`,
      { color: "555555" }
    )
  );
  children.push(spacer());
  children.push(buildContactsTable(kit.keyContacts));
  children.push(spacer());
  children.push(pageBreak());

  // ── Section 4: 30-60-90 Day Plan ─────────────────────────────
  children.push(sectionLabel("30-60-90 Day Plan"));
  children.push(h1("Your First 90 Days"));
  children.push(divider());
  children.push(body(kit.roleExpectations.overview, { italic: true, color: "555555" }));
  children.push(spacer());

  children.push(h2("30 Days"));
  kit.roleExpectations.day30.forEach((m) => children.push(bullet(m)));
  children.push(spacer());

  children.push(h2("60 Days"));
  kit.roleExpectations.day60.forEach((m) => children.push(bullet(m)));
  children.push(spacer());

  children.push(h2("90 Days"));
  kit.roleExpectations.day90.forEach((m) => children.push(bullet(m)));
  children.push(pageBreak());

  // ── Section 5: New Hire Checklist ────────────────────────────
  children.push(sectionLabel("New Hire Checklist"));
  children.push(h1("What to Do and When"));
  children.push(divider());
  children.push(
    body(
      `A pre-start through Month 1 checklist. Items are ordered by when they need to happen, not by importance. Everything here matters.`,
      { color: "555555" }
    )
  );
  children.push(spacer());

  children.push(h2("Before You Start"));
  kit.newHireChecklist.preStart.forEach((item) => children.push(checkbox(item)));
  children.push(spacer());

  children.push(h2("Day One"));
  kit.newHireChecklist.dayOne.forEach((item) => children.push(checkbox(item)));
  children.push(spacer());

  children.push(h2("Week One"));
  kit.newHireChecklist.weekOne.forEach((item) => children.push(checkbox(item)));
  children.push(spacer());

  children.push(h2("Month One"));
  kit.newHireChecklist.monthOne.forEach((item) => children.push(checkbox(item)));
  children.push(spacer());

  // ── Footer note ──────────────────────────────────────────────
  children.push(divider());
  children.push(
    body(
      `This kit was built for ${hireName} (${hireTitle}) using AGENT: Onboarding Kit Builder at promptaiagents.com. Open it, make any edits you want, and share it before Day 1.`,
      { color: "AAAAAA", size: 18, italic: true }
    )
  );

  const doc = new Document({
    creator: "promptaiagents.com",
    title: `Onboarding Kit: ${hireName}`,
    description: `Complete onboarding kit for ${hireName}, ${hireTitle}`,
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22,
            color: "333333",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,  // US Letter: 8.5 inches in DXA
              height: 15840, // US Letter: 11 inches in DXA
            },
            margin: {
              top: 1080,    // 0.75 inches
              bottom: 1080,
              left: 1260,   // 0.875 inches
              right: 1260,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Extract all form fields
    const hireName         = (formData.get("hireName")         as string | null) ?? "";
    const hireTitle        = (formData.get("hireTitle")        as string | null) ?? "";
    const department       = (formData.get("department")       as string | null) ?? "";
    const startDate        = (formData.get("startDate")        as string | null) ?? "";
    const managerName      = (formData.get("managerName")      as string | null) ?? "";
    const roleType         = (formData.get("roleType")         as string | null) ?? "individual_contributor";
    const whyHired         = (formData.get("whyHired")         as string | null) ?? "";
    const weekOnePriorities = (formData.get("weekOnePriorities") as string | null) ?? "";
    const keyTools         = (formData.get("keyTools")         as string | null) ?? "";
    const howTeamWorks     = (formData.get("howTeamWorks")     as string | null) ?? "";
    const thirtyToNinety   = (formData.get("thirtyToNinety")   as string | null) ?? "";
    const keyContacts      = (formData.get("keyContacts")      as string | null) ?? "[]";
    const teamNotes        = (formData.get("teamNotes")        as string | null) ?? "";
    const feedbackCadence  = (formData.get("feedbackCadence")  as string | null) ?? "";
    const contextFile      = formData.get("contextFile") as File | null;

    // Basic validation
    if (!hireName.trim() || !hireTitle.trim()) {
      return NextResponse.json({ error: "Hire name and title are required." }, { status: 400 });
    }

    if (whyHired.trim().length < 30) {
      return NextResponse.json({ error: "Please add more detail about why this hire was made." }, { status: 400 });
    }

    if (thirtyToNinety.trim().length < 30) {
      return NextResponse.json({ error: "Please add more detail about the 30/60/90 expectations." }, { status: 400 });
    }

    // Parse uploaded file (optional)
    const fileContext = contextFile ? await parseContextFile(contextFile) : "";

    const payload = {
      hireName, hireTitle, department, startDate, managerName, roleType,
      whyHired, weekOnePriorities, keyTools, howTeamWorks, thirtyToNinety,
      keyContacts, teamNotes, feedbackCadence,
    };

    let kitData: OnboardingKitData;

    if (!process.env.ANTHROPIC_API_KEY) {
      kitData = MOCK_KIT;
    } else {
      // Retry once on parse failure
      try {
        kitData = await generateOnboardingKit(payload, fileContext);
      } catch (err) {
        if (err instanceof SyntaxError) {
          // JSON parse failed — retry once
          kitData = await generateOnboardingKit(payload, fileContext);
        } else {
          throw err;
        }
      }
    }

    const docxBuffer = await buildDocxFile(kitData, hireName, hireTitle, managerName);
    const safeHireName = hireName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const filename = `onboarding-kit-${safeHireName}.docx`;

    const fileBlob = new Blob([new Uint8Array(docxBuffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return new Response(fileBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Kit-Filename": encodeURIComponent(filename),
        "X-Hire-Name": encodeURIComponent(hireName),
        "X-Hire-Title": encodeURIComponent(hireTitle),
      },
    });
  } catch (error) {
    console.error("Onboarding Kit API error:", error);
    return NextResponse.json(
      { error: "Something went wrong while building the kit. Please try again." },
      { status: 500 }
    );
  }
}
