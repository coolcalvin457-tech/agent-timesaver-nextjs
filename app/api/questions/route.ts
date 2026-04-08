import { NextRequest, NextResponse } from "next/server";
import { cleanJsonResponse } from "../_shared/cleanJson";

export const maxDuration = 300; // Vercel Pro max; adaptive thinking can exceed 120s

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Question {
  stem: string;
  choices: string[];
}

export interface QuestionsResponse {
  questions: Question[];
}

// ─── Fixed Questions (S111, locked) ───────────────────────────────────────────
// Three canonical questions. Stems are immutable — AI generates answer options only.
// All stems seven words or under. Spec: master-tool-spec-category-free.md §196.
const FIXED_QUESTION_STEMS: readonly [string, string, string] = [
  "What takes up most of your time?",
  "When work piles up, what happens?",
  "What would save you the most time?",
] as const;

// ─── Mock choices (used when ANTHROPIC_API_KEY is not set) ────────────────────
// Default noun-phrase answer options, 7 words max, per S111 rule.
// S120-F34: Exactly 3 AI-generated options per stem. The write-in tile
// renders as the co-equal 4th tile on the client (Peer Write-in Rule).
const MOCK_CHOICES: [string[], string[], string[]] = [
  [
    "Writing emails, docs, and reports",
    "Research and information gathering",
    "Coordinating people and tracking progress",
  ],
  [
    "Late nights and missed deadlines",
    "Quality drops across everything",
    "Constant context-switching and dropped balls",
  ],
  [
    "Faster first drafts and writing",
    "Automated research and summaries",
    "Cleaner handoffs and status updates",
  ],
];

function getMockQuestions(): Question[] {
  return FIXED_QUESTION_STEMS.map((stem, i) => ({
    stem,
    choices: MOCK_CHOICES[i],
  }));
}

// ─── Claude API Call ──────────────────────────────────────────────────────────
// Stems are locked. Claude generates 3 noun-phrase answer options per stem,
// tailored to the job title. Options: noun phrases, 7 words max, parallel structure.
// S120-F34: Count dropped from 4 to 3 so the client-side "Write your own." tile
// can render as the visible 4th tile (Peer Write-in Rule).
async function generateQuestionsWithClaude(
  jobTitle: string,
  jobDescription?: string
): Promise<Question[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const contextSection = jobDescription
    ? `\nJob Description:\n${jobDescription.slice(0, 3000)}`
    : "";

  const systemPrompt = `You generate concise, job-specific answer options for a fixed set of questions about how professionals spend their time. You never rewrite the questions. You produce noun-phrase options that sound like things a colleague in that exact role would actually say.`;

  const stemsList = FIXED_QUESTION_STEMS.map((s, i) => `Q${i + 1}: "${s}"`).join("\n");

  const prompt = `Job Title: "${jobTitle}"${contextSection}

For each of the three fixed questions below, generate exactly 3 answer options tailored to this job title.

${stemsList}

Answer option rules (strict):
- Every option is a NOUN PHRASE. No sentences. No verbs in first position. No "I" or "we" statements.
- Maximum 7 words per option. Count every word.
- Parallel structure within a question: if one option starts with a gerund, all three start with a gerund. If one starts with an adjective, all three do.
- Options must read as specific to a "${jobTitle}". A finance director and a marketing manager should see completely different options.
- No em dashes. No jargon. No generic filler like "other" or "something else".
- Do not reference specific AI tool names (ChatGPT, Claude, Gemini, etc.) in any option.
- Do NOT include a write-in or "other" option. The client renders a peer write-in tile as the visible 4th choice automatically.

Return ONLY valid JSON in this exact format, no explanation. Use the exact stem text provided above:
{
  "questions": [
    { "stem": "${FIXED_QUESTION_STEMS[0]}", "choices": ["...", "...", "..."] },
    { "stem": "${FIXED_QUESTION_STEMS[1]}", "choices": ["...", "...", "..."] },
    { "stem": "${FIXED_QUESTION_STEMS[2]}", "choices": ["...", "...", "..."] }
  ]
}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");

  const parsed = JSON.parse(cleanJsonResponse(text)) as QuestionsResponse;

  // Defensive: force the locked stems and cap choices at 3 (S120-F34).
  return parsed.questions.slice(0, 3).map((q, i) => ({
    stem: FIXED_QUESTION_STEMS[i],
    choices: q.choices.slice(0, 3),
  }));
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
// Note: `path` is still accepted in the request body for backwards compatibility
// but no longer affects the question count. Both paths receive the same three
// fixed questions. JD context, when present, informs Claude's option generation.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobTitle, jobDescription } = body as {
      jobTitle: string;
      path?: "A" | "B";
      jobDescription?: string;
    };

    if (!jobTitle) {
      return NextResponse.json(
        { error: "jobTitle is required" },
        { status: 400 }
      );
    }

    let questions: Question[];

    if (!process.env.ANTHROPIC_API_KEY) {
      // No API key — use mock data for local development
      questions = getMockQuestions();
    } else {
      try {
        questions = await generateQuestionsWithClaude(jobTitle, jobDescription);
      } catch (firstErr) {
        if (firstErr instanceof SyntaxError || (firstErr instanceof Error && firstErr.message.includes("No JSON found"))) {
          console.warn("[questions] First attempt failed, falling back to mock choices:", firstErr instanceof Error ? firstErr.message : String(firstErr));
          // Fallback: use mock choices with locked stems. Safer than a retry
          // because the stems are already fixed — we only lose personalization.
          questions = getMockQuestions();
        } else {
          throw firstErr;
        }
      }
    }

    return NextResponse.json({ questions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[questions] API error:", msg, error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
