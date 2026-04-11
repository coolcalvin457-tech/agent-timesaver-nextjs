import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { cleanJsonResponse } from "@/app/api/_shared/cleanJson";

export const maxDuration = 300; // Vercel Pro max

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowStep {
  stepNumber: number;
  stepTitle: string;
  tool: string;
  prompt: string | null;
  action: string | null;
  expectedOutput: string;
  estimatedTime: string;
  who: string | null;
  checkpoint: string | null;
  whyThisStepMatters: string | null;
}

interface WorkflowData {
  taskTitle: string;
  overview: string;
  steps: WorkflowStep[];
  totalTime: string;
  tips: string[];
  frequency: string;
  collaboration: string;
}

interface UploadedFile {
  name: string;
  type: string;
  data: string; // base64
}

interface WorkflowBuilderInput {
  taskDescription: string;
  frequency: "Daily" | "Weekly" | "Monthly" | "1x Project";
  collaboration: "Just me" | "Small team" | "Big team";
  audiencePriorities?: string;
  jobTitle?: string;
  userTools?: string;
  processFile?: UploadedFile;
  exampleFile?: UploadedFile;
}

// ─── File parsing ─────────────────────────────────────────────────────────────

// Max ~4MB decoded before we truncate (keeps token count reasonable)
const MAX_FILE_CHARS = 8000;

async function parseUploadedFile(file: UploadedFile): Promise<string> {
  const buffer = Buffer.from(file.data, "base64");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  try {
    if (ext === "txt" || ext === "md") {
      return buffer.toString("utf-8").slice(0, MAX_FILE_CHARS);
    }

    if (ext === "pdf") {
      // pdf-parse ESM export doesn't carry .default — cast to callable directly
      const pdfParseMod = await import("pdf-parse");
      const pdfParse = pdfParseMod as unknown as (data: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(buffer);
      return result.text.slice(0, MAX_FILE_CHARS);
    }

    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, MAX_FILE_CHARS);
    }
  } catch (err) {
    console.warn(`Could not parse file ${file.name}:`, err);
  }

  return "";
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(input: WorkflowBuilderInput): string {
  const { frequency, collaboration } = input;

  const frequencyRules = {
    Daily: `FREQUENCY: DAILY
- Prompts are 2-3 sentences maximum. Short, direct, no explanatory context.
- No "Why this step matters" lines on any step.
- No "next time" language anywhere in the document.
- The user will do this every day and will internalize the process quickly. Keep it tight.`,

    Weekly: `FREQUENCY: WEEKLY
- Prompts are one full paragraph with full context, clear instruction, and output format.
- No "Why this step matters" lines.
- No "next time" language in the closing section.`,

    Monthly: `FREQUENCY: MONTHLY
- Prompts are one full paragraph (same detail as Weekly).
- Add a "whyThisStepMatters" value for EVERY step: one sentence explaining the purpose of that step.
  Reason: the user won't have muscle memory. Each step needs to explain itself.
- The closing tips should include "next time" framing: reinforce that saving this doc makes the next cycle easier.`,

    "1x Project": `FREQUENCY: ONE-TIME PROJECT
- Prompts are one full paragraph (same detail as Weekly/Monthly).
- No "Why this step matters" lines (the user doesn't need to internalize a repeating process).
- No "next time" language anywhere. This is a self-contained playbook.
- Add extra setup context in the overview: what to have ready before starting, what the overall shape of the work looks like.`,
  };

  const collaborationRules = {
    "Just me": `COLLABORATION: SOLO
- All steps are sequential. No handoff notes.
- "who" field: null on every step.
- "checkpoint" field: null on every step.`,

    "Small team": `COLLABORATION: SMALL TEAM
- Add a "who" field to each step indicating ownership (e.g. "You", "You + manager", "Designer").
- Include at least one review or feedback step where another person sees the work before it moves forward.
- Add "checkpoint" values on steps that require sign-off before subsequent steps proceed.
  Format: a brief description of what approval is needed and from whom (e.g. "Director reviews draft before distribution.").`,

    "Big team": `COLLABORATION: BIG TEAM
- Add a "who" field to every step with ownership assignments.
- PARALLEL WORK (required): Identify at least one place where two people or teams can work simultaneously.
  Mark it clearly in the stepTitle (e.g. "Step 3A/3B: Budget + Narrative in Parallel") and in the action
  explain what each person does. Example: "While you build the budget (Step 3A), the project lead drafts
  the narrative (Step 3B). Both feed into Step 4." If there is genuinely no parallel work possible, state
  why in the overview.
- Add checkpoint/approval steps at natural review gates.
- Include coordination steps (e.g. "Sync with [role] before proceeding").`,
  };

  return `You are a senior operations expert and workflow designer. Your job is to produce a clear, professional, actionable workflow document for a corporate professional.

The user has a specific task they want to do better with AI. Your output is a step-by-step workflow they can follow every time the task comes up.

CORE RULES:
1. Never ask for clarification. One-shot generation. Interpret charitably.
   If the task is vague, pick the most concrete, useful interpretation and state your assumption in the overview:
   "Based on your input, this workflow focuses on [specific interpretation]."
2. MODEL-AGNOSTIC ENFORCEMENT (hard rule):
   Never name a specific AI model (ChatGPT, Claude, Gemini, Copilot, etc.) anywhere in the output.
   Always say "your AI tool" or "an AI assistant" for AI-powered steps.
   Non-AI tools (Google Docs, Excel, Slack, Notion, etc.) are named specifically.
3. No em dashes (the — character). Use a period or a colon instead.
4. Never use the words "leverage", "unlock", "supercharge", or "automate" anywhere in the workflow document.
   IMPORTANT: Do NOT add word-ban instructions or style rules inside generated prompts. The prompts you write
   are instructions the user will paste into an AI tool — they should read naturally, not contain internal
   directives about vocabulary. Keep these rules internal to your generation process only.
5. Step count: minimum 4, maximum 8. Claude decides based on task complexity.
   Fewer than 4 feels thin for a paid deliverable. More than 8 is overwhelming.
   AI PROMPT MINIMUM (hard rule): At least 40% of steps must include a non-null "prompt" field (e.g.
   3 of 7 steps, 3 of 8 steps, 2 of 5 steps). This is an AI workflow tool. Users are paying for
   AI-powered steps, not a manual checklist.
   HOW TO FIND AI OPPORTUNITIES: Before finalizing, review every manual-only step against this list.
   If a step involves any of these patterns, it needs an AI prompt:
   - Drafting or writing anything (emails, documents, reports, SOPs, proposals, summaries)
   - Reviewing, revising, or incorporating feedback into a document
   - Comparing, evaluating, or scoring options against criteria
   - Structuring, outlining, or organizing information
   - Extracting key points, requirements, or action items from source material
   - Preparing questions or talking points for a meeting or interview
   - Creating checklists, templates, or frameworks from requirements
   If you have 3+ consecutive steps with no AI prompt, you are missing opportunities.
6. Every prompt must be copy-pasteable with no editing required. Include context, instruction, and output format.
7. Expected output per step: specific and concrete, not vague ("a draft email" not "some text").
8. Tips: 1-2 tips, specific to THIS task and workflow. Not generic productivity advice.
9. TIME CONSISTENCY (hard rule, zero tolerance):
   STEP 1: Write all steps with estimatedTime values first.
   STEP 2: Add up every estimatedTime to get the true total. Use the high end of any ranges.
   STEP 3: Set totalTime to that sum (as a range if steps used ranges).
   STEP 4: Use that exact totalTime value in the overview paragraph.
   The overview, totalTime, and sum of step times must all show the same number. Never estimate time
   independently in any field. If steps sum to 145 minutes, totalTime is "about 2.5 hours" and the
   overview says "about 2.5 hours." No exceptions.

${frequencyRules[frequency]}

${collaborationRules[collaboration]}

PROMPT QUALITY STANDARD:
Prompts must match the detail level of a professional prompt library, not a generic example.
Bad: "Ask AI to summarize this meeting."
Good: "Open your AI tool and paste this prompt: 'You are helping me create a summary of a client meeting. I'll paste the raw notes below. Produce: (1) a 3-sentence executive summary, (2) a bulleted action items list with owner and deadline columns, (3) any open questions that were raised but not resolved. Format the output with clear section headers. Here are the notes: [paste notes]'"

Return ONLY valid JSON. No markdown. No explanation outside the JSON.`;
}

// ─── User message builder ─────────────────────────────────────────────────────

async function buildUserMessage(
  input: WorkflowBuilderInput,
  processText: string,
  exampleText: string
): Promise<string> {
  const { taskDescription, frequency, collaboration, audiencePriorities, jobTitle, userTools } = input;

  const audienceSection = audiencePriorities?.trim()
    ? `Audience and what they care about: ${audiencePriorities.trim()}`
    : `Audience not specified. Infer the most likely audience and their priorities from the task description${jobTitle ? `, job title (${jobTitle})` : ""}, and frequency (${frequency}). State your assumption in the overview.`;

  const toolsSection = userTools?.trim()
    ? `Tools and apps this person uses: ${userTools.trim()}`
    : "No tools specified. Reference commonly available software (e.g. Google Workspace, Microsoft Office) for non-AI steps, and use 'your AI tool' for AI-powered steps.";

  const processSection = processText
    ? `--- CURRENT PROCESS (uploaded by user) ---
${processText}
--- END CURRENT PROCESS ---

Build the workflow as an IMPROVEMENT on this existing process. Identify inefficiencies or manual steps where AI can add value. The new workflow should feel like an upgrade, not a disruption to their existing habits. Note what changed and why where relevant.`
    : "";

  const exampleSection = exampleText
    ? `--- EXAMPLE DELIVERABLE (uploaded by user) ---
${exampleText}
--- END EXAMPLE DELIVERABLE ---

Reverse-engineer the workflow from this deliverable. What does it contain? What steps would produce it? Map the final step's expected output to match this example. The workflow bridges from task start to this finished result.`
    : "";

  const bothFilesNote = processText && exampleText
    ? `Both files are provided: use the current process as the starting point and the example deliverable as the target end state. Bridge the gap with AI-powered steps.`
    : "";

  return `Build a complete workflow for this task:

Task: ${taskDescription}
Frequency: ${frequency}
Collaboration: ${collaboration}
${jobTitle ? `Job title: ${jobTitle}` : ""}
${audienceSection}
${toolsSection}
${processSection}
${exampleSection}
${bothFilesNote}

Return this exact JSON structure:
{
  "taskTitle": "Short readable name for this task (4-8 words, e.g. 'Monthly Campaign Performance Report')",
  "overview": "${frequency === "1x Project" ? "2-3 sentences. What this workflow accomplishes, what the end result is, roughly how long it takes. Include extra setup context: what to have ready before starting." : "2-3 sentences. What this workflow accomplishes, what the end result is, roughly how long it takes end to end."} If audience was inferred, state the assumption here.",
  "steps": [
    {
      "stepNumber": 1,
      "stepTitle": "Short action-oriented label (e.g. 'Gather Raw Data')",
      "tool": "Specific tool to use (e.g. 'Google Sheets', 'your AI tool', 'Slack')",
      "prompt": ${frequency === "Daily" ? '"2-3 sentence prompt. Direct, no preamble. Ready to paste." or null for manual-only steps' : '"Full paragraph prompt. Include: who you are, what you need, what format to return it in. Ready to paste with no editing." or null for manual-only steps'},
      "action": "Description of the manual action to take. null for AI-prompt-only steps. Can coexist with prompt for hybrid steps.",
      "expectedOutput": "Specific, concrete description of what the user has when this step is done.",
      "estimatedTime": "e.g. '5 minutes' or '15-20 minutes'",
      "who": ${collaboration === "Just me" ? "null" : '"Role or person responsible (e.g. \\"You\\", \\"You + manager\\", \\"Designer\\")"'},
      "checkpoint": ${collaboration === "Just me" ? "null" : '"Description of approval/review gate, or null if no sign-off needed before next step"'},
      "whyThisStepMatters": ${frequency === "Monthly" ? '"One sentence explaining why this step exists in the workflow."' : "null"}
    }
  ],
  "totalTime": "Rough total time estimate for the full workflow (e.g. '45-60 minutes')",
  "tips": ["Specific tip about this workflow (not generic advice)", ${frequency !== "1x Project" ? '"Tip about how to make this repeatable or faster over time"' : '"Tip about customizing this for your specific context"'}],
  "frequency": "${frequency}",
  "collaboration": "${collaboration}"
}`;
}

// ─── Time validation ─────────────────────────────────────────────────────────

/**
 * Extract minute values from a time string like "15-20 minutes", "2-3 hours",
 * "45 minutes", or "3-5 business days". Returns the high end in minutes.
 * Returns 0 for unparseable strings (e.g. durations measured in weeks/days
 * that represent calendar time, not active work time).
 */
function parseMinutesFromTime(timeStr: string): number {
  if (!timeStr) return 0;
  const lower = timeStr.toLowerCase();

  // Skip calendar-time entries (days, weeks) — these aren't active work time
  if (lower.includes("day") || lower.includes("week")) return 0;

  // Match patterns like "15-20 minutes", "2-3 hours", "45 minutes", "1 hour"
  const rangeMatch = lower.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(minute|hour|min|hr)/);
  if (rangeMatch) {
    const high = parseFloat(rangeMatch[2]);
    const unit = rangeMatch[3];
    return unit.startsWith("hour") || unit.startsWith("hr") ? high * 60 : high;
  }

  const singleMatch = lower.match(/(\d+(?:\.\d+)?)\s*(minute|hour|min|hr)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    const unit = singleMatch[2];
    return unit.startsWith("hour") || unit.startsWith("hr") ? val * 60 : val;
  }

  return 0;
}

function formatMinutesAsTime(minutes: number): string {
  if (minutes <= 90) return `about ${minutes} minutes`;
  const hours = minutes / 60;
  if (hours === Math.floor(hours)) return `about ${hours} hours`;
  return `about ${hours.toFixed(1)} hours`;
}

/**
 * Validate and fix time consistency: totalTime and overview must reflect the
 * sum of step estimatedTime values. Corrects in place if they diverge.
 */
function enforceTimeConsistency(workflow: WorkflowData): void {
  const stepMinutes = workflow.steps.map((s) => parseMinutesFromTime(s.estimatedTime));
  const sumMinutes = stepMinutes.reduce((a, b) => a + b, 0);

  // If we couldn't parse meaningful active time from steps, skip correction
  if (sumMinutes === 0) return;

  const totalMinutes = parseMinutesFromTime(workflow.totalTime);

  // Allow 20% tolerance — beyond that, override totalTime and patch overview
  if (totalMinutes > 0 && Math.abs(totalMinutes - sumMinutes) / sumMinutes <= 0.2) return;

  const correctedTime = formatMinutesAsTime(sumMinutes);
  workflow.totalTime = correctedTime;

  // Patch the overview: replace any time mention with the corrected value
  // Look for common patterns: "approximately X hours", "about X minutes", "roughly X-Y hours"
  const timePattern = /(?:approximately|about|roughly|around|budget|total[^.]*?)\s+\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:minutes?|hours?|hrs?|mins?)/gi;
  if (timePattern.test(workflow.overview)) {
    workflow.overview = workflow.overview.replace(timePattern, correctedTime);
  }
}

// ─── Claude API call ──────────────────────────────────────────────────────────

async function generateWorkflow(
  input: WorkflowBuilderInput,
  processText: string,
  exampleText: string
): Promise<WorkflowData> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = buildSystemPrompt(input);
  const userMessage = await buildUserMessage(input, processText, exampleText);

  const message = await client.messages.create({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.type === "text" ? block.text : "")
    .join("");

  const cleaned = cleanJsonResponse(text);
  let workflow: WorkflowData;
  try {
    workflow = JSON.parse(cleaned) as WorkflowData;
  } catch {
    // Retry with assistant prefill to force JSON continuation
    const retryMsg = await client.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 16000,
      system: systemPrompt,
      messages: [
        { role: "user", content: userMessage },
        { role: "assistant", content: "{" },
      ],
    });
    const retryText = retryMsg.content
      .filter((block) => block.type === "text")
      .map((block) => block.type === "text" ? block.text : "")
      .join("");
    workflow = JSON.parse(cleanJsonResponse("{" + retryText)) as WorkflowData;
  }

  // Server-side safety net: fix time inconsistencies the model missed
  enforceTimeConsistency(workflow);

  return workflow;
}

/**
 * Check whether the workflow meets the 40% AI prompt density minimum.
 * Returns true if at least 40% of steps have a non-null prompt.
 */
function hasMinimumPromptDensity(workflow: WorkflowData): boolean {
  if (!workflow.steps?.length) return false;
  const promptCount = workflow.steps.filter((s) => s.prompt !== null && s.prompt !== "").length;
  const ratio = promptCount / workflow.steps.length;
  return ratio >= 0.4;
}

// ─── Document helpers ─────────────────────────────────────────────────────────

function sectionLabel(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 18, bold: true, color: "1E7AB8", allCaps: true })],
    spacing: { before: 0, after: 200 },
  });
}

function h1(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Garamond", size: 36, bold: true, color: "161618" })],
    spacing: { before: 0, after: 160 },
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Garamond", size: 26, bold: true, color: "161618" })],
    spacing: { before: 240, after: 80 },
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
    spacing: { before: 60, after: 140 },
  });
}

function stepNumberLabel(num: number): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `STEP ${num}`, font: "Calibri", size: 18, bold: true, color: "1E7AB8", allCaps: true })],
    spacing: { before: 200, after: 60 },
  });
}

function stepTitle(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Garamond", size: 24, bold: true, color: "161618" })],
    spacing: { before: 0, after: 80 },
  });
}

function fieldLabel(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 19, bold: true, color: "555553" })],
    spacing: { before: 100, after: 40 },
  });
}

// Prompt block — monospace, visually distinct "copy this" treatment
function promptBlock(text: string): Paragraph {
  // Styled paragraph with left border + shading. Renders reliably in both
  // Microsoft Word and Google Docs (single-cell tables collapse in GDocs).
  return new Paragraph({
    children: [new TextRun({ text, font: "Courier New", size: 20, color: "1A3A4A" })],
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: "1E7AB8", space: 8 },
    },
    shading: { type: ShadingType.CLEAR, fill: "EEF6FB" },
    indent: { left: 120, right: 120 },
    spacing: { before: 80, after: 80, line: 300 },
  });
}

// Checkpoint callout — styled paragraphs with left border + shading.
// Switched from single-cell table (collapsed in Google Docs) to paragraph
// borders for cross-app compatibility (same rationale as promptBlock).
function checkpointBlock(text: string): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: "CHECKPOINT", font: "Calibri", size: 17, bold: true, color: "B87A00" })],
      border: {
        left: { style: BorderStyle.SINGLE, size: 12, color: "F5A623", space: 8 },
      },
      shading: { type: ShadingType.CLEAR, fill: "FDF8EE" },
      indent: { left: 120, right: 120 },
      spacing: { before: 80, after: 0 },
    }),
    new Paragraph({
      children: [new TextRun({ text, font: "Calibri", size: 20, color: "5C3D00" })],
      border: {
        left: { style: BorderStyle.SINGLE, size: 12, color: "F5A623", space: 8 },
      },
      shading: { type: ShadingType.CLEAR, fill: "FDF8EE" },
      indent: { left: 120, right: 120 },
      spacing: { before: 0, after: 80, line: 300 },
    }),
  ];
}

// ─── Build .docx ──────────────────────────────────────────────────────────────

async function buildDocxFile(workflow: WorkflowData, jobTitle?: string): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // ── Document header ───────────────────────────────────────
  children.push(sectionLabel("AGENT: Workflow"));
  children.push(h1(workflow.taskTitle));

  // Meta info table
  const metaRows: Array<[string, string]> = [
    ["Frequency", workflow.frequency],
    ["Collaboration", workflow.collaboration],
    ...(jobTitle ? [["Role", jobTitle] as [string, string]] : []),
    ["Total Time", workflow.totalTime],
    ["Generated", today],
  ];

  const borderStyle = { style: BorderStyle.SINGLE, size: 4, color: "E4E4E2" };
  const cellBorders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: metaRows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, font: "Calibri", size: 19, bold: true, color: "161618" })], spacing: { after: 0 } })],
            width: { size: 2400, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "F4F4F2" },
            borders: cellBorders,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: value, font: "Calibri", size: 19, color: "333333" })], spacing: { after: 0 } })],
            width: { size: 6960, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
            borders: cellBorders,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          }),
        ],
      })
    ),
  }));

  children.push(spacer());
  children.push(divider());

  // ── Overview ──────────────────────────────────────────────
  children.push(h2("Overview"));
  children.push(body(workflow.overview));
  children.push(spacer());
  children.push(divider());

  // ── Steps ─────────────────────────────────────────────────
  children.push(h2("Workflow Steps"));
  children.push(spacer());

  for (const step of workflow.steps) {
    children.push(stepNumberLabel(step.stepNumber));
    children.push(stepTitle(step.stepTitle));

    // Tool
    children.push(fieldLabel("Tool"));
    children.push(body(step.tool));

    // Who (small/big team only)
    if (step.who) {
      children.push(fieldLabel("Owner"));
      children.push(body(step.who));
    }

    // Prompt block (if present)
    if (step.prompt) {
      children.push(fieldLabel("Prompt"));
      children.push(promptBlock(step.prompt));
      children.push(spacer());
    }

    // Action (if present)
    if (step.action) {
      children.push(fieldLabel("Action"));
      children.push(body(step.action));
    }

    // Expected output
    children.push(fieldLabel("Expected Output"));
    children.push(body(step.expectedOutput));

    // Time estimate
    children.push(fieldLabel("Estimated Time"));
    children.push(body(step.estimatedTime));

    // Why this step matters (monthly only)
    if (step.whyThisStepMatters) {
      children.push(fieldLabel("Why This Step Matters"));
      children.push(body(step.whyThisStepMatters, { italic: true, color: "666664" }));
    }

    // Checkpoint callout (small/big team only)
    if (step.checkpoint) {
      children.push(spacer());
      children.push(...checkpointBlock(step.checkpoint));
    }

    children.push(divider());
  }

  // ── Tips ──────────────────────────────────────────────────
  if (workflow.tips?.length) {
    children.push(h2("Key Insights"));
    for (const tip of workflow.tips) {
      children.push(body(`· ${tip}`));
    }
    children.push(spacer());
  }

  // ── Next time (omit for 1x Project) ──────────────────────
  if (workflow.frequency !== "1x Project") {
    children.push(divider());
    children.push(body(
      `Save this doc. The next time ${workflow.taskTitle} comes up, start at Step 1.`,
      { italic: true, color: "888886" }
    ));
  }

  // ── Legal / branding footer ───────────────────────────────
  children.push(spacer());
  children.push(body(
    "Generated by AGENT: Workflow at promptaiagents.com. Built for real jobs. Not demos.",
    { color: "BBBBBB", size: 18, italic: true }
  ));

  const doc = new Document({
    creator: "promptaiagents.com",
    title: workflow.taskTitle,
    description: `${workflow.frequency} workflow for ${workflow.taskTitle}`,
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

// ─── Mock data for local dev ──────────────────────────────────────────────────

function buildMockWorkflow(input: WorkflowBuilderInput): WorkflowData {
  return {
    taskTitle: `${input.frequency} ${input.taskDescription.split(" ").slice(0, 4).join(" ")}`,
    overview: `This workflow covers the end-to-end process for: ${input.taskDescription}. Follow the steps below in order. Total estimated time is included at each step.`,
    steps: [
      {
        stepNumber: 1,
        stepTitle: "Gather Your Inputs",
        tool: "Google Drive or your file system",
        prompt: null,
        action: `Collect all relevant files, data, and context you'll need for ${input.taskDescription}. Create a working folder if you don't have one.`,
        expectedOutput: "All source materials in one place, ready to reference.",
        estimatedTime: "5-10 minutes",
        who: input.collaboration !== "Just me" ? "You" : null,
        checkpoint: null,
        whyThisStepMatters: input.frequency === "Monthly" ? "Starting with everything in one place prevents backtracking later in the workflow." : null,
      },
      {
        stepNumber: 2,
        stepTitle: "Draft with AI",
        tool: "Your AI tool",
        prompt: `You are helping me complete the following task: ${input.taskDescription}. I will provide context below. Please produce a structured first draft I can refine. Focus on clarity and specificity. [Paste your context here]`,
        action: null,
        expectedOutput: "A structured first draft ready for review and editing.",
        estimatedTime: "10-15 minutes",
        who: input.collaboration !== "Just me" ? "You" : null,
        checkpoint: null,
        whyThisStepMatters: input.frequency === "Monthly" ? "AI handles the first draft so you can focus your energy on review and refinement, not formatting." : null,
      },
      {
        stepNumber: 3,
        stepTitle: "Review and Refine",
        tool: "Google Docs or Microsoft Word",
        prompt: null,
        action: "Open the AI draft, read it for accuracy and tone. Edit any sections that don't reflect your actual situation or audience expectations.",
        expectedOutput: "A polished, accurate document ready to share.",
        estimatedTime: "15-20 minutes",
        who: input.collaboration !== "Just me" ? "You + manager" : null,
        checkpoint: input.collaboration !== "Just me" ? "Manager reviews before sending." : null,
        whyThisStepMatters: input.frequency === "Monthly" ? "AI drafts are starting points, not final products. This step is where your judgment adds the most value." : null,
      },
      {
        stepNumber: 4,
        stepTitle: "Deliver and Archive",
        tool: input.userTools?.includes("Slack") ? "Slack" : "Email or your preferred channel",
        prompt: null,
        action: "Send the final output to the relevant audience. Save a copy to your working folder for future reference.",
        expectedOutput: "Output delivered. File saved for next cycle.",
        estimatedTime: "5 minutes",
        who: input.collaboration !== "Just me" ? "You" : null,
        checkpoint: null,
        whyThisStepMatters: input.frequency === "Monthly" ? "Archiving each output gives you a reference library that improves future cycles." : null,
      },
    ],
    totalTime: "35-50 minutes",
    tips: [
      `For best results with the AI step, include specific numbers, dates, and names from your actual work rather than generic descriptions.`,
      input.frequency !== "1x Project"
        ? "Keep this doc open the first few times you run the workflow. It becomes faster as it becomes habit."
        : "Customize Step 1's checklist before starting: the inputs that matter most depend on the specifics of your project.",
    ],
    frequency: input.frequency,
    collaboration: input.collaboration,
  };
}

// ─── Section serialization for in-browser results (S149) ─────────────────────

interface ResultItem {
  label: string;
  detail: string;
}

interface ResultSection {
  title: string;
  content: string;
  items?: ResultItem[];
}

function buildResultSections(workflow: WorkflowData): ResultSection[] {
  // 1. Workflow Playbook: overview + numbered steps
  const playbookSection: ResultSection = {
    title: "Workflow Playbook",
    content: workflow.overview,
    items: workflow.steps.map((s) => ({
      label: `Step ${s.stepNumber}: ${s.stepTitle}`,
      detail: [
        s.tool ? `Tool: ${s.tool}` : "",
        s.action || "",
        s.prompt ? `Prompt: ${s.prompt}` : "",
        `Expected output: ${s.expectedOutput}`,
        `Time: ${s.estimatedTime}`,
        s.who ? `Owner: ${s.who}` : "",
        s.checkpoint ? `Checkpoint: ${s.checkpoint}` : "",
        s.whyThisStepMatters || "",
      ].filter(Boolean).join("\n"),
    })),
  };

  // 2. AI Setup: tools referenced across steps
  const toolSet = new Map<string, string[]>();
  for (const s of workflow.steps) {
    if (s.tool) {
      if (!toolSet.has(s.tool)) toolSet.set(s.tool, []);
      toolSet.get(s.tool)!.push(`Step ${s.stepNumber}: ${s.stepTitle}`);
    }
  }
  const aiSetupContent = Array.from(toolSet.entries())
    .map(([tool, steps]) => `${tool}\nUsed in: ${steps.join(", ")}`)
    .join("\n\n");

  const aiSetupSection: ResultSection = {
    title: "AI Setup",
    content: aiSetupContent || "No specific tools referenced.",
    items: Array.from(toolSet.entries()).map(([tool, steps]) => ({
      label: tool,
      detail: `Used in: ${steps.join(", ")}`,
    })),
  };

  // 3. AI Prompts: all prompts from steps that have them
  const promptSteps = workflow.steps.filter((s) => s.prompt);
  const aiPromptsSection: ResultSection = {
    title: "AI Prompts",
    content: promptSteps.length > 0
      ? promptSteps.map((s) => `Step ${s.stepNumber}: ${s.stepTitle}\n${s.prompt}`).join("\n\n")
      : "No AI prompts in this workflow.",
    items: promptSteps.map((s) => ({
      label: `Step ${s.stepNumber}: ${s.stepTitle}`,
      detail: s.prompt!,
    })),
  };

  // 4. Time Estimates: total + per-step breakdown
  const timeLines = workflow.steps
    .map((s) => `Step ${s.stepNumber}: ${s.stepTitle} - ${s.estimatedTime}`)
    .join("\n");

  const timeEstimatesSection: ResultSection = {
    title: "Time Estimates",
    content: `Total estimated time: ${workflow.totalTime}\n\n${timeLines}`,
    items: workflow.steps.map((s) => ({
      label: `Step ${s.stepNumber}: ${s.stepTitle}`,
      detail: s.estimatedTime,
    })),
  };

  // 5. Key Insights: tips + collaboration context
  const insightParts: string[] = [...workflow.tips];
  if (workflow.collaboration && workflow.collaboration !== "Just me") {
    insightParts.push(`This is a ${workflow.collaboration.toLowerCase()} workflow. Coordinate handoffs at each checkpoint.`);
  }
  if (workflow.frequency && workflow.frequency !== "1x Project") {
    insightParts.push(`Frequency: ${workflow.frequency}. This workflow is designed to be repeatable.`);
  }

  const keyInsightsSection: ResultSection = {
    title: "Key Insights",
    content: insightParts.join("\n\n"),
  };

  return [playbookSection, aiSetupSection, aiPromptsSection, timeEstimatesSection, keyInsightsSection];
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const input = await req.json() as WorkflowBuilderInput;

    // Validation
    if (!input.taskDescription?.trim() || input.taskDescription.trim().length < 10) {
      return NextResponse.json({ error: "Please describe the task you want a workflow for." }, { status: 400 });
    }
    if (!input.frequency) {
      return NextResponse.json({ error: "Please select how often you do this task." }, { status: 400 });
    }
    if (!input.collaboration) {
      return NextResponse.json({ error: "Please select who works on this with you." }, { status: 400 });
    }

    // Parse uploaded files
    let processText = "";
    let exampleText = "";

    if (input.processFile?.data) {
      processText = await parseUploadedFile(input.processFile);
    }
    if (input.exampleFile?.data) {
      exampleText = await parseUploadedFile(input.exampleFile);
    }

    let workflow: WorkflowData;

    if (!process.env.ANTHROPIC_API_KEY) {
      workflow = buildMockWorkflow(input);
    } else {
      workflow = await generateWorkflow(input, processText, exampleText);

      // Retry once if AI prompt density is below 40% minimum
      if (!hasMinimumPromptDensity(workflow)) {
        console.warn(
          `AGENT: Workflow: prompt density below 40% (${workflow.steps.filter((s) => s.prompt).length}/${workflow.steps.length} steps). Retrying.`
        );
        workflow = await generateWorkflow(input, processText, exampleText);
      }
    }

    const docxBuffer = await buildDocxFile(workflow, input.jobTitle);

    // Safe filename from task title
    const safeTitle = workflow.taskTitle
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const filename = `workflow-${safeTitle}.docx`;

    // Serialize structured sections for in-browser results (S149)
    const sections = buildResultSections(workflow);

    // Encode .docx as base64 for JSON transport
    const docxBase64 = Buffer.from(docxBuffer).toString("base64");

    return NextResponse.json({
      docxBase64,
      filename,
      sections,
      metadata: {
        taskTitle: workflow.taskTitle,
        stepCount: String(workflow.steps.length),
        frequency: workflow.frequency,
        jobTitle: input.jobTitle || "",
      },
    });
  } catch (error) {
    console.error("AGENT: Workflow API error:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. Your input is saved. Hit Retry and we'll try again." },
      { status: 500 }
    );
  }
}
