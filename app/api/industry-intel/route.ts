import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120; // Web search + generation exceeds Vercel's 60s default

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IntelSource {
  title: string;
  url: string;
}

export interface IndustryIntelData {
  insight: string;    // paragraphs separated by \n\n
  connection: string; // paragraphs separated by \n\n
  strategy: string[]; // 2-3 questions
  sources: IntelSource[]; // 3-5 sources
}

interface IndustryIntelInputs {
  jobTitle: string;
  companyName?: string;
  industry: string;
  companySize: string;
  decisionScope: string;
  focusArea: string;
  screen3Input?: string;
  competitor1?: string;
  competitor2?: string;
  competitor3?: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a well-informed colleague who has done the research the user didn't have time to do. Your job: find one real, current development in their industry, and connect it directly to their specific situation.

Voice rules — read these carefully, they govern every word you write:
- Write as a peer sharing something relevant. Not an analyst. Not a consultant.
- No buffer phrases. Never write "This is worth knowing," "Here's why this matters," "It's worth mentioning," or "It's interesting to note." Just say the thing.
- No commands. Never write "You should consider," "It's important that," "We recommend," or "Consider doing X." The insight speaks for itself. The connection speaks for itself.
- The user has domain expertise. They live in their industry. What they lack is time. Never explain what they already know. Surface what they haven't had time to track.
- Direct and confident. Peer-level. No hedging unless information is genuinely limited.
- No soft transition phrases. Never write "That said," "With that in mind," "This is why," or "This means that." Move directly from one point to the next.

Web search rules:
- Search before writing. Use web search to find real, current developments. Prioritize sources published in the last 6-12 months.
- Pull 3-5 sources that back up the insight. Include only sources you actually used.
- If results are thin for a niche industry or topic: write a shorter, honest insight based on what you found. Do not pad. A 150-word insight backed by real sources beats a 250-word insight built on thin ones.
- If web search returns nothing relevant: produce the insight from your training knowledge and note at the end of the insight field that it is based on general industry knowledge rather than current news. Still valuable.

Punctuation rules:
- No em dashes. Ever. Use a period or colon instead.
- No bullet points inside prose sections. Insight and Connection are paragraphs, not lists.

Return ONLY valid JSON. No explanation, no markdown fences, no commentary. Just the raw JSON object.`;

// ─── Section instructions (shared across all prompt paths) ───────────────────

function sectionInstructions(industry: string, decisionScope: string, companySize: string, companyName?: string, screen3Input?: string): string {
  const companyRef = companyName ? `If it adds specificity, reference ${companyName} directly.` : "";
  const contextRef = screen3Input ? `The user provided additional context. Reference it directly in Section 2: "${screen3Input}"` : "";

  return `
---

SECTION 1 — THE INSIGHT (2-3 paragraphs, ~200-250 words)

What is happening right now in ${industry} related to the focus area? Ground this in web search results. Be direct and current. No hedging. No buffer phrases.

This section is the broad view: give the reader the context that makes Section 2 land. Do not personalize to the user's specific role here — that is Section 2's job. Write as a peer who found something relevant and is sharing it plainly.

---

SECTION 2 — THE CONNECTION (1-2 paragraphs, ~150-200 words)

How does this insight connect to this professional's specific situation? This is where all the inputs converge.

Decision scope: "${decisionScope}"
Calibrate by decision scope:
- "I am a freelancer, or oversee less than 3 people": focus on individual decisions, client relationships, personal positioning.
- "I set the direction for an entire team": focus on team readiness, internal positioning, resource allocation.
- "I manage multiple teams and numerous projects": focus on organizational direction, cross-functional implications, long-term positioning.

Company size: "${companySize}"
Calibrate by company size:
- Under 200: lean to scaling. Resource-constrained. Decisions are faster but coverage is thin. Implications differ sharply from larger orgs.
- 200-5,000: mid-market. Decisions involve more stakeholders. Process-building and coordination matter. Change takes longer than at smaller orgs.
- 5,000+: enterprise. Change is slow, stakes are high, coordination is complex. Implications operate at a different scale.

${companyRef}
${contextRef}

No advice. No commands. Just the link between the trend and their world.

---

SECTION 3 — THE STRATEGY (2-3 questions, ~50-75 words total)

Calibrate questions to decision scope:
- "I am a freelancer, or oversee less than 3 people": questions about their own business decisions and positioning.
- "I set the direction for an entire team": questions about team readiness, internal process, and positioning relative to peers.
- "I manage multiple teams and numerous projects": questions about organizational direction, investment priorities, and long-term strategy.

Each question must be specific enough that the user can picture exactly which meeting or conversation it belongs in. These questions should confirm what they have already been thinking about — not introduce something foreign.

---

SECTION 4 — THE SOURCES (3-5 sources)

Real URLs only. Include only sources you actually used. Article title as the display text. No annotations or descriptions.

---

Return this exact JSON structure:
{
  "insight": "Paragraph one text.\\n\\nParagraph two text.\\n\\nOptional paragraph three text.",
  "connection": "Paragraph one text.\\n\\nOptional paragraph two text.",
  "strategy": [
    "Question one?",
    "Question two?",
    "Question three?"
  ],
  "sources": [
    { "title": "Article title here", "url": "https://example.com/article" },
    { "title": "Article title here", "url": "https://example.com/article" },
    { "title": "Article title here", "url": "https://example.com/article" }
  ]
}`;
}

// ─── User Prompt Builder ──────────────────────────────────────────────────────

function buildUserPrompt(inputs: IndustryIntelInputs): string {
  const {
    jobTitle, companyName, industry, companySize, decisionScope,
    focusArea, screen3Input, competitor1, competitor2, competitor3,
  } = inputs;

  const companyLine = companyName?.trim() ? `Company: ${companyName}` : `Company: Not provided`;
  const competitorNames = [competitor1, competitor2, competitor3].filter((c) => c?.trim()).map((c) => c!.trim());
  const hasNamedCompetitors = competitorNames.length > 0;
  const isCompetitorFocus = focusArea === "Competitor activity";

  const sharedSections = sectionInstructions(industry, decisionScope, companySize, companyName, screen3Input);

  // ── Standard path ──────────────────────────────────────────────────────────
  if (!isCompetitorFocus) {
    const contextLine = screen3Input?.trim()
      ? `Additional context: ${screen3Input}`
      : `Additional context: None provided`;

    return `Build an industry intel document for this professional.

INPUTS:
Job title: ${jobTitle}
${companyLine}
Industry: ${industry}
Company size: ${companySize}
Decision scope: ${decisionScope}
Focus area: ${focusArea}
${contextLine}

Search for real, current developments in ${industry} related to ${focusArea}. Run web searches before writing any section.
${sharedSections}`;
  }

  // ── Competitor: Named mode ─────────────────────────────────────────────────
  if (hasNamedCompetitors) {
    const competitorList = competitorNames.join(", ");
    const angleNote = screen3Input?.trim() ? `Specific angle: ${screen3Input}` : "";

    return `Build an industry intel document focused on competitor activity for this professional.

INPUTS:
Job title: ${jobTitle}
${companyLine}
Industry: ${industry}
Company size: ${companySize}
Decision scope: ${decisionScope}
Focus area: Competitor activity
Competitors to track: ${competitorList}
${angleNote}

Search for recent moves by these specific companies. What are they doing right now in ${industry}? Product launches, pricing changes, hiring activity, partnerships, positioning shifts. Find what is current and relevant.

Section 1 must lead with what these specific competitors are doing. Name them directly. Ground every claim in web search results. If a specific angle was provided, weight the insight toward that angle while covering the most significant moves.

Questions in Section 3 should be specifically about competitive response, positioning, or differentiation.
${sharedSections}`;
  }

  // ── Competitor: Discover mode ──────────────────────────────────────────────
  const angleNote = screen3Input?.trim() ? `Specific angle: ${screen3Input}` : "";

  return `Build an industry intel document focused on competitor activity for this professional.

INPUTS:
Job title: ${jobTitle}
${companyLine}
Industry: ${industry}
Company size: ${companySize}
Decision scope: ${decisionScope}
Focus area: Competitor activity
${angleNote}

The user did not name specific competitors. Use web search to identify 2-3 companies currently making notable moves in ${industry}. Search specifically within ${industry} — relevance to this user's specific industry matters more than company size or prominence. Look for recent product launches, pricing changes, hiring activity, funding, partnerships, or positioning shifts.

Section 1 must lead with the companies you found and what they are doing. Name them directly. Ground every claim in web search results. If a specific angle was provided, weight your company selection and the insight toward that angle.

Questions in Section 3 should be specifically about competitive response, positioning, or differentiation.
${sharedSections}`;
}

// ─── Mock fallback ─────────────────────────────────────────────────────────────

const MOCK_INTEL: IndustryIntelData = {
  insight: "Healthcare hiring entered 2026 in a structurally different position than two years prior. Travel nurse premiums have stabilized after the pandemic surge, but the underlying shortage has not resolved: the U.S. remains roughly 500,000 nurses short, and retirement curves are accelerating. The deficit is no longer concentrated in travel and temporary roles. It has shifted to advanced practice providers, nursing assistants, and home health aides, where training pipelines are thin and state-level RN surpluses mask the gap in adjacent roles hospitals depend on daily.\n\nThe demand pressure is compounded by a projected exit of more than 6.5 million healthcare professionals from the workforce before 2027. Locum tenens is filling part of the physician gap, and advanced practice providers are being asked to carry more of the clinical load. Organizations that have not restructured sourcing toward these channels are competing harder than necessary for a smaller pool.\n\nRecruitment platforms using AI-driven screening are narrowing the window between application and offer for specialized roles. In a market where APP candidates are receiving multiple offers, that speed is no longer a differentiator. It is a floor.",
  connection: "For an HR director at a mid-size health system, the stabilization of travel nurse premiums is a partial reprieve, but it does not resolve the sourcing challenge. The shortage has migrated to roles that sit right in the middle of the staffing model: nursing assistants and advanced practice providers who are not as replaceable with contracted help.\n\nAt this scale, there is formal sourcing infrastructure but not the per-diem pool depth a 5,000-person system can absorb slack with. The organizations gaining ground at this tier have restructured pipeline toward APP and non-RN clinical roles and shortened the offer-to-acceptance window.",
  strategy: [
    "Has your sourcing strategy for advanced practice providers kept pace with how much of the clinical gap they are now expected to fill?",
    "Where in your hiring funnel is the most time lost between application and offer, and what would it take to cut that window by 30%?",
    "Which clinical roles are most dependent on travel or locum staff, and what is the long-term retention play for converting those into permanent headcount?",
  ],
  sources: [
    { title: "Healthcare Staffing Shortage: Trends to Watch 2026", url: "https://3bhealthcare.us/healthcare-staffing-shortage-trends-2026/" },
    { title: "7 Healthcare Staffing Trends from 2025 and Key Forecasts for 2026", url: "https://www.locumtenens.com/news-and-insights/blog/7-healthcare-staffing-trends-from-2025-and-key-forecasts-for-2026/" },
    { title: "2026 Healthcare Staffing Trends to Watch", url: "https://www.definitivehc.com/blog/healthcare-staffing-trends" },
  ],
};

// ─── Claude API Call ──────────────────────────────────────────────────────────

async function generateIndustryIntel(inputs: IndustryIntelInputs): Promise<IndustryIntelData> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userPrompt = buildUserPrompt(inputs);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
    messages: [{ role: "user", content: userPrompt }],
  });

  // Extract text from all content blocks (web search may produce interleaved blocks)
  const text = (message.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Claude response");

  // Strip em dashes that slipped through
  const sanitized = jsonMatch[0].replace(/\u2014/g, ":").replace(/\u2013/g, "-");

  return JSON.parse(sanitized) as IndustryIntelData;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobTitle, companyName, industry, companySize, decisionScope,
      focusArea, screen3Input, competitor1, competitor2, competitor3,
    } = body as IndustryIntelInputs;

    if (!jobTitle?.trim() || !industry?.trim() || !companySize || !decisionScope || !focusArea) {
      return NextResponse.json(
        { error: "Job title, industry, company size, decision scope, and focus area are required." },
        { status: 400 }
      );
    }

    const inputs: IndustryIntelInputs = {
      jobTitle: jobTitle.trim(),
      companyName: companyName?.trim() || undefined,
      industry: industry.trim(),
      companySize,
      decisionScope,
      focusArea,
      screen3Input: screen3Input?.trim() || undefined,
      competitor1: competitor1?.trim() || undefined,
      competitor2: competitor2?.trim() || undefined,
      competitor3: competitor3?.trim() || undefined,
    };

    let intelData: IndustryIntelData;

    if (!process.env.ANTHROPIC_API_KEY) {
      intelData = MOCK_INTEL;
    } else {
      try {
        intelData = await generateIndustryIntel(inputs);
      } catch (err) {
        if (err instanceof SyntaxError) {
          // JSON parse failed — retry once
          intelData = await generateIndustryIntel(inputs);
        } else {
          throw err;
        }
      }
    }

    return NextResponse.json(intelData);
  } catch (error) {
    console.error("Industry Intel API error:", error);
    return NextResponse.json(
      { error: "Something went wrong building your intel. Please try again." },
      { status: 500 }
    );
  }
}
