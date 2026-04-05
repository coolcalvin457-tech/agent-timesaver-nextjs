import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const maxDuration = 300; // Vercel Pro max; adaptive thinking can exceed 120s

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BudgetRow {
  item: string;
  notes?: string;
  estimated: number | null;
  actual: number | null;
}

export interface BudgetSection {
  name: string;
  rows: BudgetRow[];
}

export interface BudgetSpreadsheetData {
  filename: string;
  title: string;
  subtitle: string;
  period: string;
  currency: string; // "USD", "EUR", etc.
  sections: BudgetSection[];
  hasActualColumn: boolean; // true if tracking actuals makes sense
}

// ─── Mock fallback ─────────────────────────────────────────────────────────────

const MOCK_BUDGET: BudgetSpreadsheetData = {
  filename: "Q2-Marketing-Budget.xlsx",
  title: "Q2 Marketing Budget",
  subtitle: "April - June 2026",
  period: "Q2 2026",
  currency: "USD",
  hasActualColumn: true,
  sections: [
    {
      name: "Digital Advertising",
      rows: [
        { item: "Google Ads", notes: "Search campaigns", estimated: 5000, actual: null },
        { item: "Meta Ads", notes: "Facebook + Instagram", estimated: 3000, actual: null },
        { item: "LinkedIn Ads", notes: "B2B lead generation", estimated: 2000, actual: null },
      ],
    },
    {
      name: "Content & Creative",
      rows: [
        { item: "Copywriter", notes: "Blog posts + landing pages", estimated: 2500, actual: null },
        { item: "Graphic Design", notes: "Ad creatives + social assets", estimated: 1500, actual: null },
        { item: "Video Production", notes: "1 product video", estimated: 4000, actual: null },
      ],
    },
    {
      name: "Tools & Software",
      rows: [
        { item: "Marketing automation platform", notes: "Annual contract", estimated: 1200, actual: null },
        { item: "Design tools", notes: "Canva Pro", estimated: 300, actual: null },
        { item: "Analytics tools", notes: "Tracking + reporting", estimated: 500, actual: null },
      ],
    },
    {
      name: "Events & Sponsorships",
      rows: [
        { item: "Industry conference sponsorship", notes: "Booth + materials", estimated: 8000, actual: null },
        { item: "Webinar platform", notes: "Hosting 2 webinars", estimated: 600, actual: null },
      ],
    },
  ],
};

// ─── File Parsers ─────────────────────────────────────────────────────────────

async function parseContentFile(file: File): Promise<string> {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();

  if (ext === ".xlsx") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buffer = Buffer.from(await file.arrayBuffer()) as any;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const lines: string[] = [];
      workbook.eachSheet((sheet) => {
        lines.push(`Sheet: ${sheet.name}`);
        sheet.eachRow((row) => {
          const cells = (row.values as ExcelJS.CellValue[])
            .slice(1)
            .filter((v) => v !== null && v !== undefined && v !== "")
            .map((v) => String(v));
          if (cells.length) lines.push(cells.join(" | "));
        });
      });
      return lines.slice(0, 200).join("\n");
    } catch {
      return "";
    }
  }

  try {
    const text = await file.text();
    return text.slice(0, 8000);
  } catch {
    return "";
  }
}

async function parseTemplateFile(file: File): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = Buffer.from(await file.arrayBuffer()) as any;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const lines: string[] = [];

    workbook.eachSheet((sheet) => {
      lines.push(`Sheet name: "${sheet.name}"`);
      lines.push(`Total rows with data: ${sheet.actualRowCount}`);
      lines.push(`Total columns: ${sheet.actualColumnCount}`);

      const headerRow = sheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell) => {
        if (cell.value) headers.push(String(cell.value));
      });
      if (headers.length) lines.push(`Column headers: ${headers.join(" | ")}`);

      const colAValues: string[] = [];
      sheet.getColumn(1).eachCell((cell, rowNum) => {
        if (rowNum > 1 && cell.value && colAValues.length < 30) {
          colAValues.push(String(cell.value));
        }
      });
      if (colAValues.length) lines.push(`Row labels (first column): ${colAValues.join(", ")}`);
    });

    return lines.join("\n");
  } catch {
    return "";
  }
}

// ─── Claude API Call ──────────────────────────────────────────────────────────

async function generateBudgetStructure(
  description: string,
  contentContext: string,
  templateContext: string,
): Promise<BudgetSpreadsheetData> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a financial planning expert who creates professional, immediately usable budget spreadsheets for working professionals. You understand budget structures across every department and industry — from a $5,000 event to a $5 million department.

You work in two modes:
1. Standard tracking budget: sections reflect real spend categories, hasActualColumn is true, user fills in actuals over time
2. What-if scenario budget: sections represent different scenarios or variable options side by side, hasActualColumn is false (these are planning models, not trackers)

Read the description carefully. If the user mentions scenarios, variables, headcount options, or phrases like "what if," build sections that represent each scenario or option directly — named after the scenario, not generic categories.

Budget constraint rule: if the user states a total budget amount (for example "$50K total" or "$200,000 budget"), the sum of ALL estimated values across every row in every section must equal that number exactly. Distribute amounts proportionally across categories based on industry norms for the described context. This constraint is non-negotiable — total must match stated budget.

Your output must look meaningfully different for a $10K nonprofit event vs a $500K tech department budget. Scale amounts, category depth, and line item specificity to match the described context. Generic outputs that could apply to any budget are unacceptable.`;

  const contentSection = contentContext.trim()
    ? `\n\nThe user uploaded a file with their data, notes, or existing numbers. Use this as the primary source for line items and amounts — it takes priority over generic defaults:\n\n${contentContext.trim()}`
    : "";

  const templateSection = templateContext.trim()
    ? `\n\nThe user uploaded a spreadsheet they love as a style reference. Match its structure as closely as possible — use the same categories, column organization, and level of detail:\n\n${templateContext.trim()}`
    : "";

  const userPrompt = `Create a complete, realistic budget spreadsheet based on this description:

"${description}"${contentSection}${templateSection}

Return a JSON object with this exact structure:
{
  "filename": "descriptive-filename-no-spaces.xlsx",
  "title": "Budget Title",
  "subtitle": "Time period or scope (e.g. 'Q2 2026' or 'Annual 2026' or 'Project Alpha')",
  "period": "Short period label",
  "currency": "USD",
  "hasActualColumn": true,
  "sections": [
    {
      "name": "Section Name",
      "rows": [
        {
          "item": "Line item name",
          "notes": "Brief clarifying note (optional, can be empty string)",
          "estimated": 1000,
          "actual": null
        }
      ]
    }
  ]
}

Rules:
- Create 3-6 sections. Use more sections and more line items for larger, more complex budgets.
- Each section: 3-6 realistic line items
- Budget constraint: if a total budget amount is mentioned in the description, the sum of ALL estimated values across ALL rows must equal that amount exactly. Add up every number before returning — if the total does not match the stated budget, adjust line items proportionally until it does.
- Dollar amounts must be specific and scale-appropriate. If no total is mentioned, use amounts typical for that context and scale — not round placeholder numbers.
- What-if / scenario rule: if the description mentions scenarios, variables, headcount options, or "what if," name each section after the scenario (e.g. "Scenario A: Add 2 FTEs", "Scenario B: Hire 1 Senior FTE") and set hasActualColumn to false.
- Standard budget rule: for all other budgets, set hasActualColumn to true.
- Notes field: write something concrete and specific ("Social campaigns, Q3" is better than "marketing activities"). Leave empty if you cannot write something specific — never write vague filler.
- Filename: descriptive, hyphens only (e.g. "q3-marketing-budget.xlsx")
- Year rule: unless the user specifies a year, always use the current year (${new Date().getFullYear()}) for filenames, titles, subtitles, and period labels. Never default to a past year.
- No em dashes anywhere in any field
- All "actual" values must be null
- Currency: 3-letter ISO code appropriate for the described budget (default USD)
- Self-check before returning: (1) if a budget total was stated, sum all estimated values and confirm they match — adjust if not. (2) Would this spreadsheet look different for a nonprofit event vs a tech company conference? If not, make it more specific to what was described.

Return ONLY valid JSON. No explanation text.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    max_tokens: 16000,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = (message.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Claude response");

  let jsonStr = jsonMatch[0];
  jsonStr = jsonStr
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

  const parsed = JSON.parse(jsonStr) as BudgetSpreadsheetData;
  return sanitizeBudgetData(parsed);
}

// ─── Em Dash Sanitizer ────────────────────────────────────────────────────────
// Server-side defensive strip: the system prompt instructs Claude to avoid em
// dashes, but this catches any that slip through before they are written into
// Excel cells (where there is no browser-side opportunity to fix them).
function stripEmDashes(s: string): string {
  return s.replace(/[—–]/g, " - ").replace(/ {2,}/g, " ").trim();
}

function sanitizeBudgetData(data: BudgetSpreadsheetData): BudgetSpreadsheetData {
  return {
    ...data,
    filename: stripEmDashes(data.filename),
    title: stripEmDashes(data.title),
    subtitle: stripEmDashes(data.subtitle),
    period: stripEmDashes(data.period),
    sections: data.sections.map((section) => ({
      ...section,
      name: stripEmDashes(section.name),
      rows: section.rows.map((row) => ({
        ...row,
        item: stripEmDashes(row.item),
        notes: row.notes ? stripEmDashes(row.notes) : row.notes,
      })),
    })),
  };
}

// ─── Excel File Builder ───────────────────────────────────────────────────────

async function buildExcelFile(data: BudgetSpreadsheetData): Promise<Uint8Array<ArrayBuffer>> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "promptaiagents.com";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(data.period || "Budget", {
    pageSetup: { paperSize: 9, orientation: "portrait" },
  });

  // ── Column layout ──────────────────────────────────────────────
  // With actual:    A=Section | B=Line Item | C=Estimated | D=Actual | E=Variance | F=Notes
  // Without actual: A=Section | B=Line Item | C=Estimated | D=Notes

  const colDefs: Partial<ExcelJS.Column>[] = [
    { key: "category",  width: 26 },
    { key: "item",      width: 30 },
    { key: "estimated", width: 16 },
  ];

  if (data.hasActualColumn) {
    colDefs.push({ key: "actual",   width: 16 });
    colDefs.push({ key: "variance", width: 16 });
    colDefs.push({ key: "notes",    width: 50 });
  } else {
    colDefs.push({ key: "notes",    width: 50 });
  }

  sheet.columns = colDefs;

  // Column index constants (1-based)
  const COL_SECTION  = 1;
  const COL_ITEM     = 2;
  const COL_EST      = 3;  // C — always Estimated
  const COL_ACT      = 4;  // D — Actual (hasActual only)
  const COL_VAR      = 5;  // E — Variance (hasActual only)
  const COL_NOTES    = data.hasActualColumn ? 6 : 4;  // F or D

  // Excel column letters for formula strings
  const EST_LETTER  = "C";
  const ACT_LETTER  = "D";
  const VAR_LETTER  = "E";

  // Total column count
  const numCols = data.hasActualColumn ? 6 : 4;

  // ── Color palette ──────────────────────────────────────────────
  const BLUE_DARK  = "1E7AB8";
  const BLUE_MID   = "2E8BC7";
  const BLUE_LIGHT = "E8F4FC";
  const GRAY_BG    = "F8F8F6";
  const GRAY_MID   = "E0E0DC";
  const WHITE      = "FFFFFF";
  const TEXT_DARK  = "1A1A1A";
  const TEXT_MID   = "444444";

  const currencyFormat =
    data.currency === "USD" ? '"$"#,##0.00'
    : data.currency === "EUR" ? '"€"#,##0.00'
    : data.currency === "GBP" ? '"£"#,##0.00'
    : '"$"#,##0.00';

  // ── Helper: apply light border to all cells in a row ──────────
  const setBorder = (row: ExcelJS.Row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top:    { style: "thin", color: { argb: "FF" + GRAY_MID } },
        bottom: { style: "thin", color: { argb: "FF" + GRAY_MID } },
        left:   { style: "thin", color: { argb: "FF" + GRAY_MID } },
        right:  { style: "thin", color: { argb: "FF" + GRAY_MID } },
      };
    });
  };

  // ── Row 1: Title ───────────────────────────────────────────────
  sheet.mergeCells(1, 1, 1, numCols);
  const titleRow = sheet.getRow(1);
  titleRow.height = 40;
  const titleCell = sheet.getCell("A1");
  titleCell.value = data.title;
  titleCell.font = { name: "Calibri", bold: true, size: 18, color: { argb: "FF" + WHITE } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };

  // ── Row 2: Subtitle ────────────────────────────────────────────
  sheet.mergeCells(2, 1, 2, numCols);
  const subtitleRow = sheet.getRow(2);
  subtitleRow.height = 22;
  const subtitleCell = sheet.getCell("A2");
  subtitleCell.value = data.subtitle || data.period;
  subtitleCell.font = { name: "Calibri", size: 11, color: { argb: "FF" + WHITE }, italic: true };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_MID } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };

  // ── Row 3: Spacer ──────────────────────────────────────────────
  sheet.getRow(3).height = 8;

  // ── Row 4: Column headers ──────────────────────────────────────
  const headerRow = sheet.getRow(4);
  headerRow.height = 28;

  const headerLabels: string[] = ["Section", "Line Item", "Estimated"];
  if (data.hasActualColumn) {
    headerLabels.push("Actual", "Variance", "Notes");
  } else {
    headerLabels.push("Notes");
  }

  headerLabels.forEach((label, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: "FF" + WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
    // Right-align number columns: Estimated (i=2), Actual (i=3), Variance (i=4)
    const isNumberCol = i === 2 || (data.hasActualColumn && (i === 3 || i === 4));
    cell.alignment = {
      vertical: "middle",
      horizontal: isNumberCol ? "right" : "left",
      indent: isNumberCol ? 0 : 1,
    };
    cell.border = {
      top:    { style: "thin",   color: { argb: "FF" + TEXT_DARK } },
      bottom: { style: "medium", color: { argb: "FF" + BLUE_DARK } },
      left:   { style: "thin",   color: { argb: "FF333333" } },
      right:  { style: "thin",   color: { argb: "FF333333" } },
    };
  });

  // Freeze panes below header
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 4, topLeftCell: "A5" }];

  // ── Data rows ──────────────────────────────────────────────────
  let currentRow = 5;
  const grandTotalEstimatedRefs: string[] = [];
  const grandTotalActualRefs: string[] = [];

  for (const section of data.sections) {
    const sectionEstimatedRefs: string[] = [];
    const sectionActualRefs: string[] = [];

    for (let i = 0; i < section.rows.length; i++) {
      const bRow = section.rows[i];
      const exRow = sheet.getRow(currentRow);
      exRow.height = 20;

      const isEven = i % 2 === 0;
      const rowBg = isEven ? WHITE : GRAY_BG;

      // Col A: Section name (first row of section only)
      const cellA = exRow.getCell(COL_SECTION);
      cellA.value = i === 0 ? section.name : "";
      cellA.font = { name: "Calibri", bold: i === 0, size: 10, color: { argb: "FF" + TEXT_DARK } };
      cellA.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + (i === 0 ? BLUE_LIGHT : rowBg) } };
      cellA.alignment = { vertical: "middle", indent: 1 };

      // Col B: Line item
      const cellB = exRow.getCell(COL_ITEM);
      cellB.value = bRow.item;
      cellB.font = { name: "Calibri", size: 10, color: { argb: "FF" + TEXT_MID } };
      cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + rowBg } };
      cellB.alignment = { vertical: "middle", indent: 1 };

      // Col C: Estimated
      const cellC = exRow.getCell(COL_EST);
      cellC.value = bRow.estimated ?? 0;
      cellC.numFmt = currencyFormat;
      cellC.font = { name: "Calibri", size: 10, color: { argb: "FF" + TEXT_DARK } };
      cellC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + rowBg } };
      cellC.alignment = { vertical: "middle", horizontal: "right" };
      sectionEstimatedRefs.push(`${EST_LETTER}${currentRow}`);

      if (data.hasActualColumn) {
        // Col D: Actual (user fills in)
        const cellD = exRow.getCell(COL_ACT);
        cellD.value = null;
        cellD.numFmt = currencyFormat;
        cellD.font = { name: "Calibri", size: 10, color: { argb: "FF" + TEXT_DARK } };
        cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAF8" } };
        cellD.alignment = { vertical: "middle", horizontal: "right" };
        sectionActualRefs.push(`${ACT_LETTER}${currentRow}`);

        // Col E: Variance — only shows when Actual is entered
        const cellE = exRow.getCell(COL_VAR);
        cellE.value = {
          formula: `IF(${ACT_LETTER}${currentRow}="","",${ACT_LETTER}${currentRow}-${EST_LETTER}${currentRow})`,
        };
        cellE.numFmt = currencyFormat;
        cellE.font = { name: "Calibri", size: 10 };
        cellE.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + rowBg } };
        cellE.alignment = { vertical: "middle", horizontal: "right" };

        // Col F: Notes (scroll right to read)
        const cellF = exRow.getCell(COL_NOTES);
        cellF.value = bRow.notes || "";
        cellF.font = { name: "Calibri", size: 10, color: { argb: "FF888888" }, italic: true };
        cellF.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + rowBg } };
        cellF.alignment = { vertical: "middle", indent: 1, wrapText: false };
      } else {
        // Col D (no actual): Notes
        const cellD = exRow.getCell(COL_NOTES);
        cellD.value = bRow.notes || "";
        cellD.font = { name: "Calibri", size: 10, color: { argb: "FF888888" }, italic: true };
        cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + rowBg } };
        cellD.alignment = { vertical: "middle", indent: 1 };
      }

      // Apply border to all cells, then override Actual column with dashed style
      setBorder(exRow);

      if (data.hasActualColumn) {
        exRow.getCell(COL_ACT).border = {
          top:    { style: "thin",   color: { argb: "FF" + GRAY_MID } },
          bottom: { style: "thin",   color: { argb: "FF" + GRAY_MID } },
          left:   { style: "dashed", color: { argb: "FF" + GRAY_MID } },
          right:  { style: "dashed", color: { argb: "FF" + GRAY_MID } },
        };
      }

      currentRow++;
    }

    // ── Section subtotal row ───────────────────────────────────────
    const subtotalRow = sheet.getRow(currentRow);
    subtotalRow.height = 22;

    // Merge A-B for the label
    sheet.mergeCells(currentRow, 1, currentRow, 2);
    const subtotalLabelCell = subtotalRow.getCell(1);
    subtotalLabelCell.value = `${section.name} Total`;
    subtotalLabelCell.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF" + WHITE } };
    subtotalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
    subtotalLabelCell.alignment = { vertical: "middle", indent: 1 };

    // C: Estimated subtotal
    const estimatedFormula = `SUM(${sectionEstimatedRefs.join(",")})`;
    const subtotalEstCell = subtotalRow.getCell(COL_EST);
    subtotalEstCell.value = { formula: estimatedFormula };
    subtotalEstCell.numFmt = currencyFormat;
    subtotalEstCell.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF" + WHITE } };
    subtotalEstCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
    subtotalEstCell.alignment = { vertical: "middle", horizontal: "right" };
    grandTotalEstimatedRefs.push(`${EST_LETTER}${currentRow}`);

    if (data.hasActualColumn) {
      // D: Actual subtotal — blank when no actuals entered (IF wrapper prevents $0.00)
      const actualFormula = `SUM(${sectionActualRefs.join(",")})`;
      const subtotalActCell = subtotalRow.getCell(COL_ACT);
      subtotalActCell.value = { formula: `IF(${actualFormula}=0,"",${actualFormula})` };
      subtotalActCell.numFmt = currencyFormat;
      subtotalActCell.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF" + WHITE } };
      subtotalActCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
      subtotalActCell.alignment = { vertical: "middle", horizontal: "right" };
      grandTotalActualRefs.push(`${ACT_LETTER}${currentRow}`);

      // E: Variance subtotal
      const subtotalVarCell = subtotalRow.getCell(COL_VAR);
      subtotalVarCell.value = {
        formula: `IF(${ACT_LETTER}${currentRow}=0,"",${ACT_LETTER}${currentRow}-${EST_LETTER}${currentRow})`,
      };
      subtotalVarCell.numFmt = currencyFormat;
      subtotalVarCell.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF" + WHITE } };
      subtotalVarCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
      subtotalVarCell.alignment = { vertical: "middle", horizontal: "right" };

      // F: Notes column on subtotal row — fill brand color
      const subtotalNotesCell = subtotalRow.getCell(COL_NOTES);
      subtotalNotesCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
    }

    currentRow++;

    // Spacer row between sections
    sheet.getRow(currentRow).height = 6;
    currentRow++;
  }

  // ── Grand Total row ────────────────────────────────────────────
  currentRow++; // extra breathing room
  const totalRow = sheet.getRow(currentRow);
  totalRow.height = 28;

  // Merge A-B for label
  sheet.mergeCells(currentRow, 1, currentRow, 2);
  const totalLabelCell = totalRow.getCell(1);
  totalLabelCell.value = "GRAND TOTAL";
  totalLabelCell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FF" + WHITE } };
  totalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
  totalLabelCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };

  // C: Grand total estimated
  const grandEstFormula = `SUM(${grandTotalEstimatedRefs.join(",")})`;
  const totalEstCell = totalRow.getCell(COL_EST);
  totalEstCell.value = { formula: grandEstFormula };
  totalEstCell.numFmt = currencyFormat;
  totalEstCell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FF" + WHITE } };
  totalEstCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
  totalEstCell.alignment = { vertical: "middle", horizontal: "right" };

  if (data.hasActualColumn) {
    // D: Grand total actual — blank when no actuals entered
    const grandActFormula = `SUM(${grandTotalActualRefs.join(",")})`;
    const totalActCell = totalRow.getCell(COL_ACT);
    totalActCell.value = { formula: `IF(${grandActFormula}=0,"",${grandActFormula})` };
    totalActCell.numFmt = currencyFormat;
    totalActCell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FF" + WHITE } };
    totalActCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
    totalActCell.alignment = { vertical: "middle", horizontal: "right" };

    // E: Grand total variance
    const totalVarCell = totalRow.getCell(COL_VAR);
    totalVarCell.value = {
      formula: `IF(${ACT_LETTER}${currentRow}=0,"",${ACT_LETTER}${currentRow}-${EST_LETTER}${currentRow})`,
    };
    totalVarCell.numFmt = currencyFormat;
    totalVarCell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FF" + WHITE } };
    totalVarCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
    totalVarCell.alignment = { vertical: "middle", horizontal: "right" };

    // F: Notes column on grand total — fill dark
    const totalNotesCell = totalRow.getCell(COL_NOTES);
    totalNotesCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
  }

  // ── Footer note ────────────────────────────────────────────────
  currentRow += 3;
  sheet.mergeCells(currentRow, 1, currentRow, numCols);
  const footerCell = sheet.getCell(`A${currentRow}`);
  footerCell.value = `Generated by AGENT: Spreadsheets at promptaiagents.com. Fill in the "Actual" column as expenses occur. Variance = Actual minus Estimated.`;
  footerCell.font = { name: "Calibri", size: 9, color: { argb: "FF999999" }, italic: true };
  footerCell.alignment = { horizontal: "left", indent: 1 };

  // ── Sheet 2: "How to Use This" ────────────────────────────────
  const helpSheet = workbook.addWorksheet("How to Use This");

  helpSheet.columns = [
    { key: "topic", width: 36 },
    { key: "howto", width: 64 },
  ];

  const helpHeaderRow = helpSheet.getRow(1);
  helpHeaderRow.height = 28;
  ["Topic", "How to do it"].forEach((label, i) => {
    const cell = helpHeaderRow.getCell(i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: "FF" + WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  });

  const TEXT_MID_HELP = TEXT_MID;

  const instructions: [string, string][] = [
    [
      "What each column means",
      "Section: the budget category. Line Item: the specific expense. Estimated: the planned amount. Actual: what you actually spent. Variance: Actual minus Estimated (positive = under budget, negative = over). Notes: extra context about that line item — scroll right to read.",
    ],
    [
      "Fill in the Actual column",
      "As you spend money, click the cell in the Actual column for that line item and type the amount. The Variance column updates automatically.",
    ],
    [
      "Reading the Variance column",
      "Positive number = you spent less than planned (good). Negative number = you spent more than planned. The column stays blank until you enter an Actual amount.",
    ],
    [
      "Add a new line item",
      "Click a row inside the section you want to add to, right-click, and choose Insert Row Above or Insert Row Below. Type your line item in the new row. Do not add rows below the subtotal row — that breaks the SUM formula.",
    ],
    [
      "Add a new section",
      "Select all rows of an existing section (including its subtotal row), copy them, and paste below the last section. Then rename the section label and update the line items.",
    ],
    [
      "Change a category name",
      "Click the cell that contains the section name or line item name and type the new name. Nothing else changes.",
    ],
    [
      "Adjust estimated amounts",
      "Click any cell in the Estimated column and type a new number. The subtotal and grand total rows recalculate automatically.",
    ],
    [
      "Do not delete subtotal or grand total rows",
      "The rows labeled '[Section Name] Total' and 'GRAND TOTAL' contain SUM formulas. Deleting them removes the automatic calculations. If you want to hide them, right-click the row number and choose Hide.",
    ],
    [
      "Works in Excel, Google Sheets, and Numbers",
      "This file opens in all three. If using Google Sheets, upload via File > Import. If using Numbers on Mac, double-click the file to open it.",
    ],
  ];

  instructions.forEach(([topic, howto], i) => {
    const rowNum = i + 2;
    const row = helpSheet.getRow(rowNum);
    row.height = 52;

    const bgColor = i % 2 === 0 ? "FFFFFFFF" : "FFF8F8F6";

    const topicCell = row.getCell(1);
    topicCell.value = topic;
    topicCell.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF" + TEXT_DARK } };
    topicCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    topicCell.alignment = { vertical: "top", horizontal: "left", indent: 1, wrapText: true };

    const howtoCell = row.getCell(2);
    howtoCell.value = howto;
    howtoCell.font = { name: "Calibri", size: 10, color: { argb: "FF" + TEXT_MID_HELP } };
    howtoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    howtoCell.alignment = { vertical: "top", horizontal: "left", indent: 1, wrapText: true };
  });

  helpSheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2" }];

  // ── Write to buffer ────────────────────────────────────────────
  const rawBuffer = await workbook.xlsx.writeBuffer();
  return rawBuffer as unknown as Uint8Array<ArrayBuffer>;
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const description = (formData.get("description") as string | null) ?? "";
    const contentFile  = formData.get("contentFile")  as File | null;
    const templateFile = formData.get("templateFile") as File | null;

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: "A budget description is required." },
        { status: 400 }
      );
    }

    const [contentContext, templateContext] = await Promise.all([
      contentFile  ? parseContentFile(contentFile)   : Promise.resolve(""),
      templateFile ? parseTemplateFile(templateFile) : Promise.resolve(""),
    ]);

    let budgetData: BudgetSpreadsheetData;

    if (!process.env.ANTHROPIC_API_KEY) {
      budgetData = MOCK_BUDGET;
    } else {
      budgetData = await generateBudgetStructure(description.trim(), contentContext, templateContext);
    }

    const fileBytes = await buildExcelFile(budgetData);

    const safeFilename = budgetData.filename.replace(/[^a-zA-Z0-9.\-_]/g, "-");

    const sectionsHeader = JSON.stringify(
      budgetData.sections.map((s) => ({ name: s.name, rowCount: s.rows.length }))
    );

    const fileBlob = new Blob([fileBytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return new Response(fileBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "X-Budget-Title": encodeURIComponent(budgetData.title),
        "X-Budget-Filename": encodeURIComponent(safeFilename),
        "X-Budget-Sections": encodeURIComponent(sectionsHeader),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[budget-spreadsheet] API error:", msg, error);
    return NextResponse.json(
      { error: "Failed to generate budget spreadsheet. Please try again." },
      { status: 500 }
    );
  }
}
