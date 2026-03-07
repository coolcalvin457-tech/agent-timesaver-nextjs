import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Question {
  stem: string;
  subheadline: string;
  choices: string[];
}

export interface QuestionsResponse {
  questions: Question[];
}

// ─── Mock data (used when ANTHROPIC_API_KEY is not set) ───────────────────────
const MOCK_QUESTIONS: Record<string, Question[]> = {
  marketing: [
    {
      stem: "Where does most of your time go each week?",
      subheadline: "Pick the one that feels most true right now.",
      choices: [
        "Writing content — emails, posts, copy, briefs",
        "Reporting and pulling data from multiple tools",
        "Coordinating with designers, agencies, or stakeholders",
        "Researching trends, competitors, and audiences",
      ],
    },
    {
      stem: "What does your current content or campaign workflow look like?",
      subheadline: "Be honest — there's no wrong answer here.",
      choices: [
        "It's mostly improvised — we figure it out as we go",
        "We have a loose process but it breaks down regularly",
        "We have a solid system but it's too manual",
        "Our process is good — I just want to make it faster",
      ],
    },
    {
      stem: "Which outcome would have the biggest impact on your work this month?",
      subheadline: "Choose the one that would move the needle most.",
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
      subheadline: "Pick the stage that slows you down most.",
      choices: [
        "Prospecting and building qualified lead lists",
        "Writing personalized outreach and follow-ups",
        "Preparing for calls — research, decks, talking points",
        "CRM updates, notes, and admin after calls",
      ],
    },
    {
      stem: "How many personalized outreach messages do you send in a typical week?",
      subheadline: "Rough estimate is fine.",
      choices: [
        "Fewer than 10 — quality over quantity",
        "10 to 30 — trying to find the right balance",
        "30 to 75 — volume is a big part of my strategy",
        "More than 75 — I'm in full hustle mode",
      ],
    },
    {
      stem: "What would a 10-hour-per-week time savings mean for your quota?",
      subheadline: "Choose the closest outcome.",
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
      stem: "Which type of work takes up the most time in your week?",
      subheadline: "Pick the one that fits your role best.",
      choices: [
        "Writing and communication — emails, documents, reports",
        "Research and gathering information from multiple sources",
        "Coordinating with other people and tracking progress",
        "Analysis, decisions, and preparing for meetings",
      ],
    },
    {
      stem: "How would you describe the way you currently use AI tools?",
      subheadline: "Be honest — this shapes your results.",
      choices: [
        "I barely use them — not sure where to start",
        "I've tried a few things but haven't stuck with anything",
        "I use ChatGPT or Claude occasionally but not systematically",
        "I already use AI regularly and want to go deeper",
      ],
    },
    {
      stem: "What would getting back 5 to 10 hours a week actually change for you?",
      subheadline: "Choose the outcome that resonates most.",
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

  const prompt = `You are helping build a personalized AI workflow recommendation tool for non-technical professionals.

A user has entered their job title: "${jobTitle}"${contextSection}

Generate exactly ${questionCount} multiple-choice questions to help understand how they spend their time, what their biggest bottlenecks are, and what outcomes they care most about. These questions will be used to recommend 5 personalized AI workflows.

Rules:
- Questions must be specific to their role, not generic
- Each question should have exactly 4 answer choices
- Answer choices should be parallel in structure and length
- Write a short subheadline (1 sentence) that adds context or encourages honest answers
- No jargon — write like a smart, direct colleague
- No em dashes
- Don't use "I would like to" phrasing — keep it direct

Return ONLY valid JSON in this exact format, no explanation:
{
  "questions": [
    {
      "stem": "Question text here?",
      "subheadline": "One-sentence context here.",
      "choices": ["Choice A", "Choice B", "Choice C", "Choice D"]
    }
  ]
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Claude response");

  const parsed = JSON.parse(jsonMatch[0]) as QuestionsResponse;
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
    console.error("Questions API error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
