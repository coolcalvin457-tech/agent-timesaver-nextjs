import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // Vercel Pro max; adaptive thinking can exceed 120s

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Question {
  stem: string;
  choices: string[];
}

export interface QuestionsResponse {
  questions: Question[];
}

// ─── Mock data (used when ANTHROPIC_API_KEY is not set) ───────────────────────
const MOCK_QUESTIONS: Record<string, Question[]> = {
  marketing: [
    {
      stem: "Where does most of your time go during a typical week (not your busiest)?",
      choices: [
        "Writing content — emails, posts, copy, briefs",
        "Reporting and pulling data from multiple tools",
        "Coordinating with designers, agencies, or stakeholders",
        "Researching trends, competitors, and audiences",
      ],
    },
    {
      stem: "What does your current content or campaign workflow look like?",
      choices: [
        "It's mostly improvised — we figure it out as we go",
        "We have a loose process but it breaks down regularly",
        "We have a solid system but it's too manual",
        "Our process is good — I just want to make it faster",
      ],
    },
    {
      stem: "Which outcome would have the biggest impact on your work this month?",
      choices: [
        "Producing more high-quality content in less time",
        "Making better data-driven decisions faster",
        "Spending less time on coordination and status updates",
        "Getting ahead of trends before my competitors do",
      ],
    },
  ],
  sales: [
    {
      stem: "What part of your sales cycle eats the most time?",
      choices: [
        "Prospecting and building qualified lead lists",
        "Writing personalized outreach and follow-ups",
        "Preparing for calls — research, decks, talking points",
        "CRM updates, notes, and admin after calls",
      ],
    },
    {
      stem: "How many personalized outreach messages do you send in a typical week?",
      choices: [
        "Fewer than 10 — quality over quantity",
        "10 to 30 — trying to find the right balance",
        "30 to 75 — volume is a big part of my strategy",
        "More than 75 — I'm in full hustle mode",
      ],
    },
    {
      stem: "What would a 10-hour-per-week time savings mean for your quota?",
      choices: [
        "I could finally hit my number consistently",
        "I'd be going after bigger, harder deals",
        "I'd close the same amount — just with less stress",
        "I'd have time to actually coach and develop my team",
      ],
    },
  ],
  default: [
    {
      stem: "Which type of work takes up the most time during a typical week (not your busiest)?",
      choices: [
        "Writing and communication — emails, documents, reports",
        "Research and gathering information from multiple sources",
        "Coordinating with other people and tracking progress",
        "Analysis, decisions, and preparing for meetings",
      ],
    },
    {
      stem: "How would you describe the way you currently use AI tools?",
      choices: [
        "I barely use them — not sure where to start",
        "I've tried a few things but haven't stuck with anything",
        "I use ChatGPT or Claude occasionally but not systematically",
        "I already use AI regularly and want to go deeper",
      ],
    },
    {
      stem: "What would getting back 5 to 10 hours a week actually change for you?",
      choices: [
        "I'd finally finish projects I've been putting off",
        "I'd spend more time on the strategic work I actually enjoy",
        "I'd have breathing room instead of always being behind",
        "I'd take on more responsibility or bigger opportunities",
      ],
    },
  ],
};

function getJobCategory(title: string): string {
  const t = title.toLowerCase();
  if (/market|content|brand|seo|growth|demand|social/i.test(t)) return "marketing";
  if (/sales|account exec|bdr|sdr|business dev|revenue/i.test(t)) return "sales";
  if (/teacher|instructor|educator|professor|tutor|coach/i.test(t)) return "teacher";
  if (/hr|human resource|people ops|recruiter|talent/i.test(t)) return "hr";
  if (/nurse|doctor|physician|clinical|patient|medical|health/i.test(t)) return "healthcare";
  if (/financ|accountant|analyst|cfo|controller|budget/i.test(t)) return "finance";
  if (/product manager|pm |program manager|project manager/i.test(t)) return "pm";
  return "default";
}

function getMockQuestions(
  jobTitle: string,
  path: "A" | "B",
  jobDescription?: string
): Question[] {
  const category = getJobCategory(jobTitle);
  const pool = MOCK_QUESTIONS[category] ?? MOCK_QUESTIONS["default"];
  // Path A = 2 questions, Path B = 3 questions
  return path === "A" ? pool.slice(0, 2) : pool.slice(0, 3);
}

// ─── Claude API Call ──────────────────────────────────────────────────────────
async function generateQuestionsWithClaude(
  jobTitle: string,
  path: "A" | "B",
  jobDescription?: string
): Promise<Question[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const questionCount = path === "A" ? 2 : 3;
  const contextSection = jobDescription
    ? `\nJob Description:\n${jobDescription.slice(0, 3000)}`
    : "";

  const systemPrompt = `You write sharp, specific questions for working professionals. Your job is to surface the most useful information about how someone actually spends their time, so AI workflow recommendations can be tailored to their real work and not a generic job description.`;

  const jdInstruction = jobDescription
    ? `Pull specific responsibilities, tasks, and language directly from the job description above into the question choices. The choices should name real tasks from their role, not generic categories.`
    : `Use your knowledge of this specific role to write choices that name real tasks professionals in this position actually do — not broad categories.`;

  const prompt = `A user has entered their job title: "${jobTitle}"${contextSection}

Generate exactly ${questionCount} multiple-choice questions to understand how they work. These answers will be used to recommend 5 specific AI workflows for their job.

Question design rules:
- Each question must hit a distinct angle — cover these in order: (1) where their time actually goes during a typical week, (2) how mature or broken their current workflow is, (3) what a meaningful breakthrough would look like for them
- Questions must read as specific to this job title — a question for a "${jobTitle}" should sound completely different from a question for a different role
- ${jdInstruction}
- Each question must have exactly 4 answer choices, parallel in structure and length
- If a question could be ambiguous about timeframe or scope, fold the clarification into the stem itself in parentheses — e.g., "What takes up the most time during a typical week (not your busiest)?"
- No em dashes
- No jargon
- Write like a direct colleague, not a survey form

Return ONLY valid JSON in this exact format, no explanation:
{
  "questions": [
    {
      "stem": "Question text here?",
      "choices": ["Choice A", "Choice B", "Choice C", "Choice D"]
    }
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

  // Extract JSON from response
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

  const parsed = JSON.parse(jsonStr) as QuestionsResponse;
  return parsed.questions;
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobTitle, path, jobDescription } = body as {
      jobTitle: string;
      path: "A" | "B";
      jobDescription?: string;
    };

    if (!jobTitle || !path) {
      return NextResponse.json(
        { error: "jobTitle and path are required" },
        { status: 400 }
      );
    }

    let questions: Question[];

    if (!process.env.ANTHROPIC_API_KEY) {
      // No API key — use mock data for local development
      questions = getMockQuestions(jobTitle, path, jobDescription);
    } else {
      questions = await generateQuestionsWithClaude(
        jobTitle,
        path,
        jobDescription
      );
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
