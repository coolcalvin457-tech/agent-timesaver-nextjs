import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import FirecrawlApp from "@mendable/firecrawl-js";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageBreak,
} from "docx";
import { getMonthlyDossierRunCount, logDossierRun } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { cleanJsonResponse } from "@/app/api/_shared/cleanJson";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5-minute ceiling for Map + Claude #1 + Scrape + Claude #2 + docx

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHLY_RUN_LIMIT = 15;

const RELATIONSHIP_BLOCKS: Record<string, string> = {
  "Competitor": `RELATIONSHIP TYPE: COMPETITOR

The user views this company as a competitor. Your analysis must be shaped by this lens throughout.

Specific instructions by section:
- Section 2 (Business Model and Pricing): Highlight pricing differences, tier structures, and any visible price anchoring or discounting strategy. Flag where they are more or less aggressive than typical for the market.
- Section 3 (Target Market and Positioning): Identify where their stated ICP overlaps with the user's market. Quote their positioning language and note where it competes directly with common alternatives, including (if the user provided their company description) the user's own positioning.
- Section 5 (Growth Signals): Flag any signals of expansion into the user's core market segments. Hiring in sales, marketing, or product for segments the user owns is a threat signal.
- Section 6 (Content and Public Voice): A competitor's content strategy reveals their positioning ambitions. What topics are they trying to own? Who are they writing for? Are they going after the same audience as the user? Note any content gaps or topic avoidance -- these are openings.
- Section 7 (Strengths and Gaps): Be direct about gaps. A weak pricing page, thin case study library, or content strategy that avoids certain topics are real competitive openings.
- Section 8 (What This Means for You): This section must answer: Where is their positioning weaker than yours? Where are the market gaps they are not addressing? What should you watch for in the next 6 to 12 months? If the user provided their company description, draw direct comparisons. Provide 3 to 5 specific next steps a professional in their role can act on now.`,

  "Prospect or lead": `RELATIONSHIP TYPE: PROSPECT OR LEAD

The user is preparing to sell to, pitch, or approach this company. Your analysis must be shaped by this lens throughout.

Specific instructions by section:
- Section 2 (Business Model and Pricing): Note their spending posture. A company with premium pricing and enterprise positioning likely has budget. A freemium-first company may be more cost-sensitive. This matters for how the user frames their pitch.
- Section 3 (Target Market and Positioning): Identify what this company cares about. Their positioning language reveals their priorities. The user's pitch should speak to those priorities directly.
- Section 4 (Product and Service Breakdown): Understanding what they sell helps the user identify where their own solution fits -- as an enhancement, a replacement, or a complement. If the user provided a company description, note directly where their offering maps onto this company's product surface.
- Section 5 (Growth Signals): Growth signals reveal buying signals. A company hiring aggressively in a department that the user's product serves is in buying mode. Note these directly.
- Section 7 (Strengths and Gaps): Gaps are entry points. Where they are weak or underinvested is where a well-positioned pitch lands.
- Section 8 (What This Means for You): This section must answer: What does this company care about most right now? How should the user frame their pitch or approach? What objections should they prepare for? What is the most compelling angle for the opening conversation? Provide 3 to 5 specific next steps the user can take before or during their outreach.`,

  "Partner": `RELATIONSHIP TYPE: PARTNER

The user is evaluating or building a partnership with this company. Your analysis must be shaped by this lens throughout.

Specific instructions by section:
- Section 3 (Target Market and Positioning): Assess customer base overlap. Strong partnerships work when both companies serve the same customer with complementary (not competing) offerings. Note where alignment exists and where it is ambiguous.
- Section 4 (Product and Service Breakdown): Identify where their product or service complements the user's. Flag any areas where their offering overlaps with the user's in a way that could create friction in the partnership.
- Section 5 (Growth Signals): Growth signals reveal where the partner is heading. A partner moving into markets or capabilities the user depends on is a risk. A partner expanding in ways that increase distribution for the user is an opportunity.
- Section 7 (Strengths and Gaps): Note where their operational or cultural gaps might create friction in a working partnership.
- Section 8 (What This Means for You): This section must answer: How complementary is this company to the user's business? Where is there genuine partnership upside? What are the risks, friction points, or dependency risks to watch for? What does a strong partnership proposal look like given what you now know about them? Provide 3 to 5 specific next steps for moving the partnership forward.`,

  "Vendor or supplier": `RELATIONSHIP TYPE: VENDOR OR SUPPLIER

The user is evaluating this company as a vendor or supplier. Your analysis must be shaped by this lens throughout.

Specific instructions by section:
- Section 2 (Business Model and Pricing): Pricing transparency is a key trust signal. Note whether pricing is published, gated, or absent. Enterprise-only pricing with no self-serve option may indicate slow sales cycles or high switching costs.
- Section 4 (Product and Service Breakdown): Assess how clearly they communicate what they deliver. Vague product descriptions, missing documentation, or overly broad service offerings are reliability risk signals.
- Section 5 (Growth Signals): A vendor growing fast is not always a good thing. Rapid headcount growth in some areas with stagnant customer support hiring may signal service degradation risk.
- Section 6 (Content and Public Voice): Publishing frequency and topic consistency signal organizational health. A vendor with irregular content production or messaging that shifts frequently may have internal instability.
- Section 7 (Strengths and Gaps): Frame gaps in terms of vendor risk. Missing documentation, no visible customer success signals, or thin case study evidence are procurement red flags.
- Section 8 (What This Means for You): This section must answer: What are the signals that this vendor can be relied on? What are the risk factors to validate before signing a contract? What alternatives should be on the shortlist? What due diligence questions should the user prioritize? Provide 3 to 5 specific next steps for the evaluation process.`,

  "Acquisition target": `RELATIONSHIP TYPE: ACQUISITION TARGET

The user is evaluating this company as a potential acquisition target. Your analysis must be shaped by this lens throughout.

This is the most analytically demanding relationship type. Every section should be read through the lens of: what does this signal about the company's value, risk, and integration feasibility?

Specific instructions by section:
- Section 1 (Company Snapshot): For an acquisition target, this section must establish the basics that matter in a deal context: founding year (if available), apparent company size and stage, leadership signals (founders still involved vs. professional management layer), and a one-sentence read on where they sit in the market lifecycle.
- Section 2 (Business Model and Pricing): Revenue model clarity matters. A clean, recurring subscription business with published pricing is more predictable than a services-heavy or custom-pricing model.
- Section 4 (Product and Service Breakdown): Assess product depth and architecture signals. A company with a narrow, deep product is easier to integrate than one with a scattered feature surface.
- Section 5 (Growth Signals): Hiring patterns are the clearest signal. Map growth posture explicitly: heavy sales and marketing vs. engineering investment tells a different story.
- Section 7 (Strengths and Gaps): Frame strengths as acquisition upside and gaps as integration risk or price-reduction leverage.
- Section 8 (What This Means for You): This section must answer: What is the apparent strategic value of acquiring this company? What are the key integration risks? What would due diligence need to focus on given the public signals? What is the strongest argument for and against this acquisition? Provide 3 to 5 specific next steps for the evaluation process.`,

  "General research": `RELATIONSHIP TYPE: GENERAL RESEARCH

The user wants a thorough, balanced understanding of this company. There is no specific relationship lens to apply. Produce an evenhanded analysis across all 8 sections.

Do not artificially weight any section. Give each section appropriate depth based on how much data is available and how important it is for understanding this company.

Section 8 (What This Means for You): Even without a specific relationship context, this section must still be personalized to the user's stated role and industry. Answer: given who this person is and what they do, what is most relevant for them to understand about this company? What would a smart professional in their position want to act on or watch? Provide 3 to 5 specific next steps or watch items relevant to their role.`,
};

const BASE_SYSTEM_PROMPT = `You are a senior competitive intelligence analyst. You have been given scraped content from a company's public website and a set of user inputs describing who the user is and how they relate to this company.

Your job is to produce a structured, professional competitive intelligence dossier in JSON format. The dossier has 8 sections. Each section has specific requirements described below.

---

VOICE AND STYLE RULES (mandatory -- do not deviate):
- Write in a professional, direct, analytical tone. Every sentence must either inform or recommend. Remove filler.
- No em dashes. Use periods or colons instead.
- No generic observations. "They have a blog" is not intelligence. "They published 12 posts in Q1, all focused on enterprise use cases, suggesting a deliberate shift upmarket" is intelligence.
- Prose only. No bullet lists unless explicitly called for in a section spec. Bullet lists appear only in Section 8's "Next Steps."
- Spell out numbers in prose ("eight sections," "three products"). Use numerals when the number is a specific data point or measurement ("$49/month," "14 open roles").
- Do not speculate about private financials, revenue, or valuation unless they appear explicitly in the scraped content. If you supplement with training knowledge, note it briefly ("Based on publicly available information...").
- Never fabricate specific data points. If you do not have enough information for a section, say so plainly and fill with what you do have.

---

SUPPLEMENTATION RULE:
If the scraped pages do not contain enough information to fully populate a section, supplement with your training knowledge about this company and industry. When supplementing, note where the information comes from: "Based on publicly available information..." Do not fabricate specific numbers (revenue, headcount, funding amounts) unless they appear in the scraped content or you are highly confident they are accurate and publicly known.

For small or obscure companies with limited public presence: note at the top of the relevant section that public data is limited and the analysis reflects what was available.

For very small sites where fewer than 5 pages were successfully scraped: open the Company Snapshot section with a one-sentence disclosure: "This report combines data from [Company Name]'s public website with publicly available information, as the site has limited publicly accessible content." Do not repeat this disclosure in other sections.

---

PRIORITY FOCUS RULE:
If the user selected one or more priority focus areas (Pricing Strategy, Market Positioning, Growth Direction, Product Capabilities, Hiring Signals, Content Strategy), the corresponding sections should be given approximately 2x the depth. Do not shrink other sections to compensate. Expand the priority sections.

Priority area to section mapping:
- Pricing Strategy: Section 2
- Market Positioning: Section 3
- Product Capabilities: Section 4
- Growth Direction: Section 5
- Hiring Signals: Section 5
- Content Strategy: Section 6

---

EXISTING KNOWLEDGE RULE:
If the user has noted what they already know about this company, do not repeat or dwell on that information. Acknowledge it briefly if it surfaces in the data, then go deeper on what is new or less obvious.

---

RESEARCH FOCUS RULE:
If the user described what they want to learn in their own words (the "Research focus" field), treat this as the guiding question for the entire dossier. Every section should be written with an eye toward answering that question, not just completing its assigned scope. Section 8 must address it directly. If the research focus and the priority focus chips conflict or overlap, let the free-text focus take precedence.

---

LANGUAGE RULE:
Always write the dossier in English, regardless of the language of the scraped content. If the target company's website is in a non-English language, analyze the content and write all dossier sections in English. You may quote brief phrases in the original language if the phrasing itself is analytically relevant, but immediately follow any non-English quote with an English translation.`;

const OUTPUT_FORMAT_INSTRUCTIONS = `OUTPUT FORMAT:
Return a single JSON object. No text before or after the JSON. The format is:

{
  "companyName": "string",
  "inferredName": true or false,
  "pagesAnalyzed": number,
  "dataQuality": "rich" | "moderate" | "limited",
  "dataQualityNote": "string or null",
  "sections": {
    "snapshot": {
      "title": "Company Snapshot",
      "content": "string -- 2 to 3 paragraphs. Cover: what the company does in plain language, founding year and brief history if available, headquarters location, rough size indicators, and a single sentence on where they sit in their market."
    },
    "businessModel": {
      "title": "Business Model and Pricing",
      "content": "string -- 3 to 5 paragraphs. Include specific pricing numbers if available."
    },
    "targetMarket": {
      "title": "Target Market and Positioning",
      "content": "string -- 3 to 5 paragraphs. Quote or closely paraphrase their actual positioning language."
    },
    "products": {
      "title": "Product and Service Breakdown",
      "content": "string -- 4 to 6 paragraphs. Synthesize, do not list features."
    },
    "growthSignals": {
      "title": "Growth Signals",
      "content": "string -- 4 to 6 paragraphs. Interpret hiring patterns, content focus, and announcements as signals, not facts."
    },
    "publicVoice": {
      "title": "Content and Public Voice",
      "content": "string -- 2 to 4 paragraphs."
    },
    "strengthsGaps": {
      "title": "Strengths and Gaps",
      "content": "string -- 4 to 6 paragraphs. Identify 3 to 5 strengths and 3 to 5 gaps. Each must cite specific evidence from earlier sections."
    },
    "forYou": {
      "title": "What This Means for You",
      "content": "string -- 5 to 8 paragraphs. Fully personalized to the user's role, industry, and relationship type.",
      "nextSteps": ["string", "string", "string"]
    }
  }
}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDossierSystemPrompt(relationshipType: string): string {
  const block = RELATIONSHIP_BLOCKS[relationshipType] ?? RELATIONSHIP_BLOCKS["General research"];
  return `${BASE_SYSTEM_PROMPT}\n\n---\n\n${block}\n\n---\n\n${OUTPUT_FORMAT_INSTRUCTIONS}`;
}

function stripEmDashes(text: string): string {
  return text
    .replace(/\u2014/g, " ")  // em dash
    .replace(/\u2013/g, " ")  // en dash
    .replace(/  +/g, " ")     // collapse double spaces
    .trim();
}

function stripEmDashesDeep(obj: unknown): unknown {
  if (typeof obj === "string") return stripEmDashes(obj);
  if (Array.isArray(obj)) return obj.map(stripEmDashesDeep);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, stripEmDashesDeep(v)])
    );
  }
  return obj;
}

function truncateToTokenBudget(content: string, tokenBudget: number): string {
  // Rough estimate: 1 token ≈ 4 characters
  const charBudget = tokenBudget * 4;
  if (content.length <= charBudget) return content;
  // Truncate at last complete paragraph within budget
  const truncated = content.slice(0, charBudget);
  const lastPara = truncated.lastIndexOf("\n\n");
  return lastPara > charBudget * 0.5 ? truncated.slice(0, lastPara) : truncated;
}

// ─── Token budget helper ──────────────────────────────────────────────────────

function getTokenBudget(priority: number): number {
  if (priority <= 3) return 3000;
  if (priority <= 7) return 2000;
  return 1000;
}

// ─── SSE helpers ─────────────────────────────────────────────────────────────

function sseEvent(event: string, data: Record<string, unknown>): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── In-browser results types (S149) ──────────────────────────────────────────

interface ResultItem {
  label: string;
  detail: string;
}

interface ResultSection {
  title: string;
  content: string;
  items?: ResultItem[];
}

// ─── docx builder ─────────────────────────────────────────────────────────────

interface DossierData {
  companyName: string;
  inferredName: boolean;
  pagesAnalyzed: number;
  dataQuality: string;
  dataQualityNote: string | null;
  sections: {
    snapshot: { title: string; content: string };
    businessModel: { title: string; content: string };
    targetMarket: { title: string; content: string };
    products: { title: string; content: string };
    growthSignals: { title: string; content: string };
    publicVoice: { title: string; content: string };
    strengthsGaps: { title: string; content: string };
    forYou: { title: string; content: string; nextSteps: string[] };
  };
}

function buildResultSections(dossier: DossierData): ResultSection[] {
  const sectionOrder: (keyof typeof dossier.sections)[] = [
    "snapshot", "businessModel", "targetMarket", "products",
    "growthSignals", "publicVoice", "strengthsGaps", "forYou",
  ];

  return sectionOrder.map((key) => {
    const section = dossier.sections[key];
    const result: ResultSection = {
      title: section.title,
      content: section.content,
    };
    // forYou has nextSteps array
    if (key === "forYou" && "nextSteps" in section) {
      const forYouSection = section as { title: string; content: string; nextSteps: string[] };
      if (forYouSection.nextSteps.length > 0) {
        result.items = forYouSection.nextSteps.map((step, i) => ({
          label: `Next Step ${i + 1}`,
          detail: step,
        }));
      }
    }
    return result;
  });
}

function buildDocx(
  dossier: DossierData,
  jobTitle: string,
  companyUrl: string
): Promise<Buffer> {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sectionOrder: (keyof typeof dossier.sections)[] = [
    "snapshot",
    "businessModel",
    "targetMarket",
    "products",
    "growthSignals",
    "publicVoice",
    "strengthsGaps",
    "forYou",
  ];

  const children: Paragraph[] = [
    // Title page
    new Paragraph({
      text: "Competitive Intelligence Dossier",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: dossier.companyName, bold: true, size: 48 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Prepared for: ${jobTitle}`, size: 24, color: "555555" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Generated: ${today}`, size: 24, color: "555555" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Source: ${companyUrl}`, size: 20, color: "888888" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${dossier.pagesAnalyzed} pages analyzed`,
          size: 20,
          color: "888888",
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    // Page break before content
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // Sections
  sectionOrder.forEach((key, idx) => {
    const section = dossier.sections[key];

    // Section heading
    children.push(
      new Paragraph({
        text: `${idx + 1}. ${section.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: idx === 0 ? 0 : 480, after: 240 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "1E7AB8", space: 4 },
        },
      })
    );

    // Section body paragraphs
    const paragraphs = section.content.split("\n\n").filter(Boolean);
    paragraphs.forEach((para) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: para.trim(), size: 22 })],
          spacing: { after: 200 },
          indent: { left: 0 },
        })
      );
    });

    // Next Steps (Section 8 only)
    if (key === "forYou" && dossier.sections.forYou.nextSteps?.length) {
      children.push(
        new Paragraph({
          text: "Next Steps",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 320, after: 160 },
        })
      );
      dossier.sections.forYou.nextSteps.forEach((step, i) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}.  `, bold: true, size: 22 }),
              new TextRun({ text: step.trim(), size: 22 }),
            ],
            spacing: { after: 160 },
            indent: { left: 360 },
          })
        );
      });
    }
  });

  // Footer note
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Generated by Prompt AI Agents · promptaiagents.com",
          size: 18,
          color: "AAAAAA",
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 960 },
    })
  );

  const doc = new Document({
    sections: [{ children }],
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
  });

  return Packer.toBuffer(doc) as Promise<Buffer>;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: Record<string, unknown>) {
        controller.enqueue(sseEvent(event, data));
      }

      try {
        // ── Auth check ──────────────────────────────────────────────────────
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("paa_session")?.value;
        if (!sessionCookie) {
          send("error", { type: "auth_required", message: "Please sign in to use this tool." });
          controller.close();
          return;
        }

        const authUser = await verifyToken(sessionCookie);
        if (!authUser) {
          send("error", { type: "auth_required", message: "Session expired. Please sign in again." });
          controller.close();
          return;
        }

        const userId = authUser.id;
        const userEmail = authUser.email;

        // ── Monthly run limit check ──────────────────────────────────────────
        const runCount = await getMonthlyDossierRunCount(userId);
        if (runCount >= MONTHLY_RUN_LIMIT) {
          const resetDate = new Date();
          resetDate.setMonth(resetDate.getMonth() + 1);
          resetDate.setDate(1);
          const resetStr = resetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });
          send("error", {
            type: "run_limit_reached",
            message: `You have reached your ${MONTHLY_RUN_LIMIT}-run monthly limit. Your limit resets on ${resetStr}.`,
          });
          controller.close();
          return;
        }

        // ── Parse request body ───────────────────────────────────────────────
        const body = await req.json() as {
          companyUrl: string;
          companyName?: string;
          relationshipType: string;
          researchFocus?: string;
          priorityFocusAreas?: string[];
          existingKnowledge?: string;
          jobTitle: string;
          userIndustry: string;
          userCompanyDescription?: string;
        };

        const {
          companyUrl,
          companyName,
          relationshipType,
          researchFocus,
          priorityFocusAreas = [],
          existingKnowledge,
          jobTitle,
          userIndustry,
          userCompanyDescription,
        } = body;

        if (!companyUrl || !relationshipType || !jobTitle || !userIndustry) {
          send("error", { type: "invalid_input", message: "Required fields missing." });
          controller.close();
          return;
        }

        const firecrawlKey = process.env.FIRECRAWL_API_KEY;
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!firecrawlKey || !anthropicKey) {
          send("error", { type: "config_error", message: "Service not configured. Contact support." });
          controller.close();
          return;
        }

        const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });
        const anthropic = new Anthropic({ apiKey: anthropicKey });

        // ── Step 1: Map the site ─────────────────────────────────────────────
        send("progress", { step: 1, label: "Mapping website structure...", status: "in_progress" });

        let mapLinks: string[] = [];
        try {
          const mapResult = await firecrawl.map(companyUrl, { limit: 500 } as Record<string, unknown>);
          if (!mapResult.links || mapResult.links.length === 0) {
            send("error", { type: "site_unreachable", message: "We could not reach that website. Check the URL and try again." });
            controller.close();
            return;
          }
          // links is SearchResultWeb[] — extract url strings
          mapLinks = mapResult.links.map((l: { url: string } | string) =>
            typeof l === "string" ? l : l.url
          ).filter(Boolean);
        } catch {
          send("error", { type: "site_unreachable", message: "We could not reach that website. Check the URL and try again." });
          controller.close();
          return;
        }

        // Sort shallower paths first, truncate at 500
        mapLinks = mapLinks
          .sort((a, b) => (a.split("/").length - b.split("/").length))
          .slice(0, 500);

        send("progress", { step: 1, label: "Mapping website structure...", status: "complete" });

        // ── Step 2: Claude selects pages ─────────────────────────────────────
        send("progress", { step: 2, label: "Selecting high-value pages...", status: "in_progress" });

        const pageSelectionSystemPrompt = `You are a competitive intelligence analyst. Your job is to select the most valuable pages from a company website for building a competitive intelligence dossier.

You will receive a list of URLs from a single company's website. Select the 10 most valuable pages for research purposes. If the site has fewer than 10 worthwhile pages, return all of them.

Prioritize pages in this order:
1. Homepage (always include)
2. About, team, company history, or leadership pages
3. Pricing pages
4. Careers or jobs pages (these reveal hiring patterns and strategic direction)
5. Recent blog posts (the 3 to 5 most recent)
6. Product or service description pages
7. Case studies or customer stories
8. Press, news, or announcement pages

Exclude: login pages, account pages, legal pages (terms, privacy), error pages, duplicate content, and any page that is clearly a redirect or tracking URL.

Return your response as a JSON object in this exact format:
{
  "selected": [
    { "url": "https://example.com/about", "priority": 1, "reason": "About page" }
  ]
}

The "priority" field is an integer. Lower numbers = higher priority. Be precise. Do not include explanatory text outside the JSON object.`;

        const urlList = mapLinks.join("\n");
        let selectedPages: Array<{ url: string; priority: number; reason: string }> = [];

        try {
          const selectionRes = await (anthropic.messages.create as Function)({
            model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
            max_tokens: 2048,
            system: pageSelectionSystemPrompt,
            messages: [
              {
                role: "user",
                content: `Here is the full list of URLs discovered on the target company's website:\n\n${urlList}\n\nSelect the 10 most valuable pages for competitive intelligence research. Return your selection as the JSON format specified in your instructions.`,
              },
            ],
          });

          const selectionText = selectionRes.content
            .filter((b: { type: string }) => b.type === "text")
            .map((b: { text: string }) => b.text)
            .join("\n");

          const parsed = JSON.parse(cleanJsonResponse(selectionText));
          selectedPages = parsed.selected ?? [];
        } catch {
          // Fall back: use first 10 URLs
          selectedPages = mapLinks.slice(0, 10).map((url, i) => ({ url, priority: i + 1, reason: "Auto-selected" }));
        }

        if (selectedPages.length === 0) {
          selectedPages = mapLinks.slice(0, 10).map((url, i) => ({ url, priority: i + 1, reason: "Auto-selected" }));
        }

        // Sort by priority
        selectedPages.sort((a, b) => a.priority - b.priority);

        send("progress", { step: 2, label: "Selecting high-value pages...", status: "complete" });

        // ── Step 3: Scrape selected pages ────────────────────────────────────
        const displayName = companyName ?? new URL(companyUrl.startsWith("http") ? companyUrl : `https://${companyUrl}`).hostname.replace("www.", "");
        send("progress", { step: 3, label: `Scanning ${displayName} for intelligence...`, status: "in_progress" });

        // Scrape in parallel with per-page timeout
        const SCRAPE_TIMEOUT_MS = 15000;
        const scrapeResults = await Promise.allSettled(
          selectedPages.map(async (page) => {
            const result = await Promise.race([
              firecrawl.scrape(page.url, { formats: ["markdown"] }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Scrape timeout")), SCRAPE_TIMEOUT_MS)
              ),
            ]);
            return { url: page.url, priority: page.priority, content: result.markdown ?? "" };
          })
        );

        const successfulPages = scrapeResults
          .filter((r): r is PromiseFulfilledResult<{ url: string; priority: number; content: string }> =>
            r.status === "fulfilled" && r.value.content.length > 50
          )
          .map((r) => r.value);

        if (successfulPages.length < 3) {
          send("error", {
            type: "insufficient_data",
            message: "This site appears to be behind a login or has very limited public content. Try the company's main marketing website instead.",
          });
          controller.close();
          return;
        }

        // Build scraped content block with token truncation
        const scrapedContent = successfulPages
          .map((page) => {
            const truncated = truncateToTokenBudget(page.content, getTokenBudget(page.priority));
            return `--- PAGE: ${page.url} [Priority Rank: ${page.priority}] ---\n${truncated}`;
          })
          .join("\n\n");

        send("progress", { step: 3, label: `Scanning ${displayName} for intelligence...`, status: "complete" });

        // ── Step 4: Generate dossier ─────────────────────────────────────────
        send("progress", { step: 4, label: "Analyzing competitive signals...", status: "in_progress" });

        const priorityAreasStr = priorityFocusAreas.length > 0 ? priorityFocusAreas.join(", ") : "None selected";

        const userPrompt = `SCRAPED WEBSITE CONTENT:
The following pages were scraped from the target company's public website. Each page is labeled with its URL and priority rank.

${scrapedContent}

---

USER INPUTS:

Target company URL: ${companyUrl}
Company name (if provided): ${companyName ?? "Not provided"}
Relationship type: ${relationshipType}

Research focus (user's own words, if provided): ${researchFocus ?? "Not provided"}
Priority focus areas selected: ${priorityAreasStr}
What the user already knows (if provided): ${existingKnowledge ?? "Not provided"}

User's job title: ${jobTitle}
User's industry: ${userIndustry}
User's company or product description (if provided): ${userCompanyDescription ?? "Not provided"}

---

Produce the competitive intelligence dossier as specified. Return only the JSON object. No text before or after the JSON.`;

        let dossierData: DossierData;
        try {
          const dossierRes = await (anthropic.messages.create as Function)({
            model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
            max_tokens: 12000,
            system: buildDossierSystemPrompt(relationshipType),
            messages: [{ role: "user", content: userPrompt }],
          });

          const dossierText = dossierRes.content
            .filter((b: { type: string }) => b.type === "text")
            .map((b: { text: string }) => b.text)
            .join("\n");

          dossierData = stripEmDashesDeep(JSON.parse(cleanJsonResponse(dossierText))) as DossierData;
        } catch {
          // Retry once
          try {
            const retryRes = await (anthropic.messages.create as Function)({
              model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
              max_tokens: 12000,
              system: buildDossierSystemPrompt(relationshipType),
              messages: [
                { role: "user", content: userPrompt },
                {
                  role: "assistant",
                  content: "{",
                },
              ],
            });
            const retryText = retryRes.content
              .filter((b: { type: string }) => b.type === "text")
              .map((b: { text: string }) => b.text)
              .join("\n");
            dossierData = stripEmDashesDeep(JSON.parse(cleanJsonResponse("{" + retryText))) as DossierData;
          } catch {
            send("error", { type: "generation_failed", message: "Your dossier could not be generated. This is on us. Please try again." });
            controller.close();
            return;
          }
        }

        send("progress", { step: 4, label: "Analyzing competitive signals...", status: "complete" });

        // ── Step 5: Tailor insights ──────────────────────────────────────────
        send("progress", { step: 5, label: "Tailoring insights to your role...", status: "complete" });

        // ── Step 6: Build .docx ──────────────────────────────────────────────
        send("progress", { step: 6, label: "Formatting your dossier...", status: "in_progress" });

        const docxBuffer = await buildDocx(dossierData, jobTitle, companyUrl);
        const docxBase64 = docxBuffer.toString("base64");

        send("progress", { step: 6, label: "Formatting your dossier...", status: "complete" });

        // ── Log the run ──────────────────────────────────────────────────────
        await logDossierRun(userId, userEmail, companyUrl, dossierData.companyName ?? companyName ?? null);

        // ── Send complete event ──────────────────────────────────────────────
        // Serialize structured sections for in-browser results (S149)
        const sections = buildResultSections(dossierData);

        send("complete", {
          docxBase64,
          sections,
          metadata: {
            companyName: dossierData.companyName,
            pagesAnalyzed: successfulPages.length,
            totalPagesDiscovered: mapLinks.length,
            jobTitle,
          },
        });

        controller.close();
      } catch (err) {
        console.error("[competitive-dossier] Unhandled error:", err);
        try {
          controller.enqueue(
            sseEvent("error", { type: "server_error", message: "Something went wrong on our end. Please try again." })
          );
        } catch {
          // controller already closed
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
