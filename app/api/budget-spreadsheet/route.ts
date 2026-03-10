import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

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
  subtitle: "April – June 2026",
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

// Extract readable text from the content file (data/notes).
// Supports .xlsx, .csv, .txt
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
            .slice(1) // ExcelJS row.values is 1-indexed with a null at [0]
            .filter((v) => v !== null && v !== undefined && v !== "")
            .map((v) => String(v));
          if (cells.length) lines.push(cells.join(" | "));
        });
      });
      return lines.slice(0, 200).join("\n"); // cap at 200 lines
    } catch {
      return ""; // parsing failed — continue without this context
    }
  }

  // .csv or .txt — read as plain text, cap at 8000 chars
  try {
    const text = await file.text();
    return text.slice(0, 8000);
  } catch {
    return "";
  }
}

// Extract structure description from a template .xlsx (style reference).
// Returns a text summary of the sheet: headers, category names, column layout.
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

      // First row = likely headers
      const headerRow = sheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell) => {
        if (cell.value) headers.push(String(cell.value));
      });
      if (headers.length) lines.push(`Column headers: ${headers.join(" | ")}`);

      // First column values = likely category names / row labels
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
    return ""; // parsing failed — continue without template context
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

  const systemPrompt = `You are a financial planning expert who creates professional budget spreadsheets for non-technical professionals. You understand common budget structures across departments, projects, and personal finance. You create organized, realistic, immediately usable spreadsheets.`;

  const contentSection = contentContext.trim()
    ? `\n\nThe user also uploaded a file with their data, notes, or existing budget information. Use this as source material for the line items and amounts — prioritize it over generic defaults:\n\n${contentContext.trim()}`
    : "";

  const templateSection = templateContext.trim()
    ? `\n\nThe user uploaded a spreadsheet they love as a style reference. Match its structure as closely as possible — use the same categories, column organization, and level of detail shown below:\n\n${templateContext.trim()}`
    : "";

  const userPrompt = `Create a complete, realistic budget spreadsheet structure based on this description:

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
- Create 3-6 meaningful sections relevant to the budget type
- Each section should have 3-6 realistic line items
- Use real, specific dollar amounts that are realistic for the budget type and scale described
- If the user mentions a total budget or scale, distribute it realistically
- If no scale is mentioned, use reasonable professional defaults
- Set "hasActualColumn" to true for tracking budgets (project, department, event) or false for planning-only budgets (personal planning, future projections)
- The "notes" field should give a brief clarifying detail about what the line item covers — keep it under 8 words, or leave it empty
- Filename should be descriptive and use hyphens (e.g. "annual-marketing-budget.xlsx")
- No em dashes anywhere
- All "actual" values should be null (the user will fill these in)
- currency should be the 3-letter ISO code most appropriate for the described budget (default USD unless context suggests otherwise)

Return ONLY valid JSON. No explanation text.`;

  const message = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Claude response");

  return JSON.parse(jsonMatch[0]) as BudgetSpreadsheetData;
}

// ─── Excel File Builder ───────────────────────────────────────────────────────

async function buildExcelFile(data: BudgetSpreadsheetData): Promise<Uint8Array<ArrayBuffer>> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "promptaiagents.com";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(data.period || "Budget", {
    pageSetup: { paperSize: 9, orientation: "portrait" },
  });

  // ── Column definitions ─────────────────────────────────────────
  const colDefs: Partial<ExcelJS.Column>[] = [
    { key: "category", width: 26 },
    { key: "item", width: 32 },
    { key: "notes", width: 36 },
    { key: "estimated", width: 18 },
  ];

  if (data.hasActualColumn) {
    colDefs.push({ key: "actual", width: 18 });
    colDefs.push({ key: "variance", width: 18 });
  }

  sheet.columns = colDefs;

  // ── Color palette ──────────────────────────────────────────────
  const BLUE_DARK = "1E7AB8";   // brand primary
  const BLUE_MID  = "2E8BC7";
  const BLUE_LIGHT = "E8F4FC";
  const GRAY_BG   = "F8F8F6";
  const GRAY_MID  = "E0E0DC";
  const WHITE     = "FFFFFF";
  const TEXT_DARK = "1A1A1A";
  const TEXT_MID  = "444444";
  const RED_LIGHT  = "FDE8E8";
  const GREEN_LIGHT = "E6F4EA";

  const currencyFormat =
    data.currency === "USD" ? '"$"#,##0.00'
    : data.currency === "EUR" ? '"€"#,##0.00'
    : data.currency === "GBP" ? '"£"#,##0.00'
    : '"$"#,##0.00';

  // ── Helper: apply border to a row range ───────────────────────
  const setBorder = (row: ExcelJS.Row, thin = false) => {
    const style: ExcelJS.BorderStyle = thin ? "thin" : "medium";
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF" + GRAY_MID } },
        bottom: { style: "thin", color: { argb: "FF" + GRAY_MID } },
        left: { style: "thin", color: { argb: "FF" + GRAY_MID } },
        right: { style: "thin", color: { argb: "FF" + GRAY_MID } },
      };
    });
  };

  const numCols = data.hasActualColumn ? 6 : 4;

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

  const headerLabels: string[] = ["Section", "Line Item", "Notes", "Estimated"];
  if (data.hasActualColumn) {
    headerLabels.push("Actual", "Variance");
  }

  headerLabels.forEach((label, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: "FF" + WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
    cell.alignment = { vertical: "middle", horizontal: i >= 3 ? "right" : "left", indent: i < 3 ? 1 : 0 };
    cell.border = {
      top: { style: "thin", color: { argb: "FF" + TEXT_DARK } },
      bottom: { style: "medium", color: { argb: "FF" + BLUE_DARK } },
      left: { style: "thin", color: { argb: "FF333333" } },
      right: { style: "thin", color: { argb: "FF333333" } },
    };
  });

  // Freeze panes at row 5 (below header)
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 4, topLeftCell: "A5" }];

  // ── Data rows ─────────────────────────────────────────────────
  let currentRow = 5;
  const grandTotalEstimatedRefs: string[] = [];
  const grandTotalActualRefs: string[] = [];

  for (const section of data.sections) {
    const sectionStartRow = currentRow;

    // Section subtotal row refs
    const sectionEstimatedRefs: string[] = [];
    const sectionActualRefs: string[] = [];

    for (let i = 0; i < section.rows.length; i++) {
      const bRow = section.rows[i];
      const exRow = sheet.getRow(currentRow);
      exRow.height = 20;

      const isEven = i % 2 === 0;
      const rowBg = isEven ? WHITE : GRAY_BG;

      // Col A: Section name (only on first row of section)
      const cellA = exRow.getCell(1);
      cellA.value = i === 0 ? section.name : "";
      cellA.font = { name: "Calibri", bold: i === 0, size: 10, color: { argb: "FF" + TEXT_DARK } };
      cellA.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + (i === 0 ? BLUE_LIGHT : rowBg) } };
      cellA.alignment = { vertical: "middle", indent: 1 };

      // Col B: Item
      const cellB = exRow.getCell(2);
      cellB.value = bRow.item;
      cellB.font = { name: "Calibri", size: 10, color: { argb: "FF" + TEXT_MID } };
      cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + rowBg } };
      cellB.alignment = { vertical: "middle", indent: 1 };

      // Col C: Notes
      const cellC = exRow.getCell(3);
      cellC.value = bRow.notes || "";
      cellC.font = { name: "Calibri", size: 10, color: { argb: "FF888888" }, italic: true };
      cellC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + rowBg } };
      cellC.alignment = { vertical: "middle", indent: 1 };

      // Col D: Estimated
      const cellD = exRow.getCell(4);
      cellD.value = bRow.estimated ?? 0;
      cellD.numFmt = currencyFormat;
      cellD.font = { name: "Calibri", size: 10, color: { argb: "FF" + TEXT_DARK } };
      cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + rowBg } };
      cellD.alignment = { vertical: "middle", horizontal: "right" };
      sectionEstimatedRefs.push(`D${currentRow}`);

      if (data.hasActualColumn) {
        // Col E: Actual (user fills in)
        const cellE = exRow.getCell(5);
        cellE.value = null;
        cellE.numFmt = currencyFormat;
        cellE.font = { name: "Calibri", size: 10, color: { argb: "FF" + TEXT_DARK } };
        cellE.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAF8" } };
        cellE.alignment = { vertical: "middle", horizontal: "right" };
        cellE.border = {
          top: { style: "thin", color: { argb: "FF" + GRAY_MID } },
          bottom: { style: "thin", color: { argb: "FF" + GRAY_MID } },
          left: { style: "dashed", color: { argb: "FF" + GRAY_MID } },
          right: { style: "dashed", color: { argb: "FF" + GRAY_MID } },
        };
        sectionActualRefs.push(`E${currentRow}`);

        // Col F: Variance (formula: Actual - Estimated, only if actual entered)
        const cellF = exRow.getCell(6);
        cellF.value = { formula: `IF(E${currentRow}="","",E${currentRow}-D${currentRow})` };
        cellF.numFmt = currencyFormat;
        cellF.font = { name: "Calibri", size: 10 };
        cellF.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + rowBg } };
        cellF.alignment = { vertical: "middle", horizontal: "right" };
      }

      setBorder(exRow);
      currentRow++;
    }

    // Section subtotal row
    const subtotalRow = sheet.getRow(currentRow);
    subtotalRow.height = 22;

    const cellA = subtotalRow.getCell(1);
    cellA.value = `${section.name} Total`;
    cellA.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF" + WHITE } };
    cellA.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
    cellA.alignment = { vertical: "middle", indent: 1 };

    // Merge cols B and C for subtotal label area
    sheet.mergeCells(currentRow, 2, currentRow, 3);
    const cellBC = subtotalRow.getCell(2);
    cellBC.value = "";
    cellBC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };

    const estimatedFormula = `SUM(${sectionEstimatedRefs.join(",")})`;
    const cellD = subtotalRow.getCell(4);
    cellD.value = { formula: estimatedFormula };
    cellD.numFmt = currencyFormat;
    cellD.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF" + WHITE } };
    cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
    cellD.alignment = { vertical: "middle", horizontal: "right" };
    grandTotalEstimatedRefs.push(`D${currentRow}`);

    if (data.hasActualColumn) {
      const actualFormula = `SUM(${sectionActualRefs.join(",")})`;
      const cellE = subtotalRow.getCell(5);
      cellE.value = { formula: actualFormula };
      cellE.numFmt = currencyFormat;
      cellE.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF" + WHITE } };
      cellE.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
      cellE.alignment = { vertical: "middle", horizontal: "right" };
      grandTotalActualRefs.push(`E${currentRow}`);

      const cellF = subtotalRow.getCell(6);
      cellF.value = { formula: `IF(E${currentRow}=0,"",E${currentRow}-D${currentRow})` };
      cellF.numFmt = currencyFormat;
      cellF.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF" + WHITE } };
      cellF.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BLUE_DARK } };
      cellF.alignment = { vertical: "middle", horizontal: "right" };
    }

    currentRow++;

    // Spacer row between sections
    const spacerRow = sheet.getRow(currentRow);
    spacerRow.height = 6;
    currentRow++;
  }

  // ── Grand Total row ────────────────────────────────────────────
  currentRow++; // extra space
  const totalRow = sheet.getRow(currentRow);
  totalRow.height = 28;

  sheet.mergeCells(currentRow, 1, currentRow, 3);
  const totalLabelCell = totalRow.getCell(1);
  totalLabelCell.value = "GRAND TOTAL";
  totalLabelCell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FF" + WHITE } };
  totalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
  totalLabelCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };

  const grandEstFormula = `SUM(${grandTotalEstimatedRefs.join(",")})`;
  const totalEstCell = totalRow.getCell(4);
  totalEstCell.value = { formula: grandEstFormula };
  totalEstCell.numFmt = currencyFormat;
  totalEstCell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FF" + WHITE } };
  totalEstCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
  totalEstCell.alignment = { vertical: "middle", horizontal: "right" };

  if (data.hasActualColumn) {
    const grandActFormula = `SUM(${grandTotalActualRefs.join(",")})`;
    const totalActCell = totalRow.getCell(5);
    totalActCell.value = { formula: grandActFormula };
    totalActCell.numFmt = currencyFormat;
    totalActCell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FF" + WHITE } };
    totalActCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
    totalActCell.alignment = { vertical: "middle", horizontal: "right" };

    const totalVarCell = totalRow.getCell(6);
    totalVarCell.value = { formula: `IF(E${currentRow}=0,"",E${currentRow}-D${currentRow})` };
    totalVarCell.numFmt = currencyFormat;
    totalVarCell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FF" + WHITE } };
    totalVarCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
    totalVarCell.alignment = { vertical: "middle", horizontal: "right" };
  }

  // ── Notes row ──────────────────────────────────────────────────
  currentRow += 3;
  sheet.mergeCells(currentRow, 1, currentRow, numCols);
  const notesCell = sheet.getCell(`A${currentRow}`);
  notesCell.value = `Generated by AGENT: Budget Spreadsheets at promptaiagents.com. Fill in the "Actual" column as expenses occur. Variance = Actual minus Estimated.`;
  notesCell.font = { name: "Calibri", size: 9, color: { argb: "FF999999" }, italic: true };
  notesCell.alignment = { horizontal: "left", indent: 1 };

  // ── Sheet 2: "How to Use This" ────────────────────────────────
  const helpSheet = workbook.addWorksheet("How to Use This");

  helpSheet.columns = [
    { key: "topic", width: 36 },
    { key: "howto", width: 64 },
  ];

  // Header row
  const helpHeaderRow = helpSheet.getRow(1);
  helpHeaderRow.height = 28;
  ["Topic", "How to do it"].forEach((label, i) => {
    const cell = helpHeaderRow.getCell(i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: "FF" + WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TEXT_DARK } };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  });

  const instructions: [string, string][] = [
    [
      "What each column means",
      "Section: the budget category. Line Item: the specific expense. Notes: a short detail. Estimated: the planned amount. Actual: what you actually spent. Variance: Actual minus Estimated (positive = under budget, negative = over).",
    ],
    [
      "Fill in the Actual column",
      "As you spend money, click the cell in the Actual column for that line item and type the amount. The Variance column updates automatically.",
    ],
    [
      "Reading the Variance column",
      "Positive number = you spent less than planned (good). Negative number = you spent more than planned. The formula only shows a result once you've entered an Actual amount.",
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
    howtoCell.font = { name: "Calibri", size: 10, color: { argb: "FF" + TEXT_MID } };
    howtoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    howtoCell.alignment = { vertical: "top", horizontal: "left", indent: 1, wrapText: true };
  });

  // Freeze the header row
  helpSheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2" }];

  // ── Write to buffer ────────────────────────────────────────────
  // ExcelJS returns Buffer (which extends Uint8Array). We cast through unknown
  // to satisfy TS5 strict ArrayBuffer vs ArrayBufferLike checks at call site.
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

    // Parse uploaded files in parallel (failures are silent — context just becomes "")
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
    console.error("Budget Spreadsheet API error:", error);
    return NextResponse.json(
      { error: "Failed to generate budget spreadsheet. Please try again." },
      { status: 500 }
    );
  }
}
