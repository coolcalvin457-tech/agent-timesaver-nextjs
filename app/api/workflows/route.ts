import { NextRequest, NextResponse } from "next/server";
import { cleanJsonResponse } from "../_shared/cleanJson";

// NOTE (S115, F46): This route path `/api/workflows` is kept as-is to avoid a
// migration. The URL is internal plumbing and does not leak to users. All
// types, variables, copy, and system-prompt output use "time-savers"
// terminology. "Workflow" / "workflows" is reserved exclusively for
// AGENT: Workflow (the $49/yr paid tool). See master spec Layer 1 §1.1.

export const maxDuration = 300; // Vercel Pro max; adaptive thinking can exceed 120s

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TimeSaver {
  title: string;
  description: string;
  tool: string; // Deprecated (S112-F25/F32): always "" for model-agnostic output.
  // Retained in the type for backwards compatibility with cached mock data and
  // client rendering guards. New content must not reference a specific AI tool.
  timeSavedPerWeek: number; // hours
}

export interface ROI {
  totalHoursPerWeek: number;
  annualHours: number;
  valueAtSalary: string; // formatted string e.g. "$8,400"
  industry: string;
}

export interface TimeSaversResponse {
  timeSavers: TimeSaver[];
  roi: ROI;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_TIME_SAVERS: Record<string, TimeSaversResponse> = {
  marketing: {
    timeSavers: [
      {
        title: "First-Draft Content Machine",
        description:
          "Give an AI tool your brief and target audience. Get a polished first draft of any content in under 2 minutes. Works for emails, social posts, landing pages, and blog intros.",
        tool: "",
        timeSavedPerWeek: 3,
      },
      {
        title: "Weekly Performance Summary",
        description:
          "Paste your raw analytics data into an AI tool. Ask it to summarize key trends, flag anomalies, and pull out the 3 insights your team actually needs to hear.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Competitor Content Monitoring",
        description:
          "Use an AI research tool to track competitor content, product launches, and positioning changes weekly. Summarize findings in a format you can share with your team in minutes.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Campaign Brief Generator",
        description:
          "Describe your campaign goal to an AI tool. It drafts a complete creative brief including target audience, messaging pillars, channel recommendations, and success metrics.",
        tool: "",
        timeSavedPerWeek: 1,
      },
      {
        title: "Meeting Prep + Recap System",
        description:
          "Before any stakeholder meeting, ask an AI tool to draft an agenda and talking points. After the meeting, paste your notes and get a clean summary with action items in 60 seconds.",
        tool: "",
        timeSavedPerWeek: 1,
      },
    ],
    roi: {
      totalHoursPerWeek: 8,
      annualHours: 416,
      valueAtSalary: "$10,400",
      industry: "Marketing",
    },
  },
  sales: {
    timeSavers: [
      {
        title: "Personalized Outreach at Scale",
        description:
          "Give an AI tool a prospect's LinkedIn, company page, and your offer. Get a personalized 3-sentence opener and full email in 30 seconds. Send 5x more quality outreach without sounding like a template.",
        tool: "",
        timeSavedPerWeek: 4,
      },
      {
        title: "Pre-Call Research Brief",
        description:
          "Before any discovery or demo call, ask an AI research tool to gather intel on the company. Have an AI writing tool turn those findings into a 1-page brief with likely objections, key priorities, and talking points.",
        tool: "",
        timeSavedPerWeek: 2,
      },
      {
        title: "CRM Note Cleaner",
        description:
          "Paste your messy call notes into an AI tool. Ask it to extract next steps, key quotes, deal stage updates, and a clean summary formatted for your CRM. Done in under a minute.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Follow-Up Sequence Builder",
        description:
          "Describe where a deal stands and what the prospect's main hesitation is. An AI tool writes a 3-touch follow-up sequence tailored to their objection, not a generic template.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Proposal and Deck Outliner",
        description:
          "Give an AI tool the deal context, company background, and your solution. It drafts a complete proposal outline or deck structure you can hand to design or fill in yourself.",
        tool: "",
        timeSavedPerWeek: 1,
      },
    ],
    roi: {
      totalHoursPerWeek: 10,
      annualHours: 520,
      valueAtSalary: "$13,000",
      industry: "Sales",
    },
  },
  default: {
    timeSavers: [
      {
        title: "First-Draft Writer",
        description:
          "Give an AI tool context, audience, and goal. Get a polished first draft of any document, email, or report in under 3 minutes. Stop staring at blank pages.",
        tool: "",
        timeSavedPerWeek: 2.5,
      },
      {
        title: "Meeting Prep + Recap System",
        description:
          "Before meetings, ask an AI tool to draft agendas and talking points from your notes. After meetings, paste your notes back and get a clean summary with action items in 60 seconds.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Research Summarizer",
        description:
          "Use an AI research tool to gather information on any topic quickly. Have it synthesize multiple sources into a clean briefing document you can use or share immediately.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Email Inbox Processor",
        description:
          "Forward complex email threads to an AI tool. Ask it to summarize context, identify what you actually need to respond to, and draft a reply. Works for any inbox type.",
        tool: "",
        timeSavedPerWeek: 1,
      },
      {
        title: "Weekly Status Report Builder",
        description:
          "Give an AI tool your bullet-point notes from the week. Ask it to turn them into a polished status update in whatever format your stakeholders expect.",
        tool: "",
        timeSavedPerWeek: 0.5,
      },
    ],
    roi: {
      totalHoursPerWeek: 7,
      annualHours: 364,
      valueAtSalary: "$7,280",
      industry: "Professional",
    },
  },
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

function getMockTimeSavers(jobTitle: string): TimeSaversResponse {
  const category = getJobCategory(jobTitle);
  return MOCK_TIME_SAVERS[category] ?? MOCK_TIME_SAVERS["default"];
}

// ─── Claude API Call ──────────────────────────────────────────────────────────
async function generateTimeSaversWithClaude(
  jobTitle: string,
  answers: string[],
  path: "A" | "B",
  jobDescription?: string
): Promise<TimeSaversResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const contextSection = jobDescription
    ? `\nJob Description:\n${jobDescription.slice(0, 3000)}`
    : "";
  const answersSection = answers.map((a, i) => `Q${i + 1}: ${a}`).join("\n");

  const systemPrompt = `You are an expert at helping corporate professionals understand exactly how AI can replace manual, time-consuming work in their specific job. You write in plain language and produce recommendations that feel like they were written by a colleague who knows their role inside out. You are deliberately tool-agnostic: you describe time-savers by what the person does and what they get back, never by which chatbot or product they use.

RESERVED TERMINOLOGY RULE (strict, S115-F46):
The word "workflow" is reserved for a different product and MUST NOT appear in your output, in any form.
- Do NOT use: workflow, workflows, Workflow, Workflows
- Use instead: "time-saver" (hyphenated, lowercase), "AI time-saver", or describe the thing directly ("a way to draft your first pass", "a quick research routine", etc.)
- This applies to the title field, the description field, and anywhere else in the JSON.`;

  const prompt = `Job Title: "${jobTitle}"${contextSection}

Their answers to follow-up questions:
${answersSection}

Generate exactly 5 AI time-saver recommendations for this person. Each time-saver must be specific to their job title and directly informed by their answers above.

For each time-saver:
- Give it a short, memorable name (3-7 words) that references their specific type of work, not a generic task category. Do NOT include the word "workflow" in the title.
- Write 2-3 sentences using this structure: (1) Start with the trigger — when they would use this, or what they paste into AI. (2) Describe the exact action — what to hand it and how to use it. (3) State the concrete outcome — what they get back and how fast.
- Estimate realistic hours saved per week (0.5 to 4 hours — be conservative and credible)

MODEL-AGNOSTIC RULE (strict, S112):
- Do NOT name any specific AI tool, model, product, or company anywhere in the title, description, or the "tool" field.
- Banned words anywhere in output: Claude, ChatGPT, GPT, OpenAI, Anthropic, Gemini, Bard, Perplexity, Notion AI, Copilot, Llama, Mistral, Grok.
- Refer to "AI", "an AI assistant", "a research AI", or "an AI writing tool" when you need to name the category of tool. Prefer verbs over tool names: "ask AI to summarize", "paste your notes into AI", "have AI draft the reply".
- The "tool" field in the JSON must always be an empty string "". It is retained for backwards compatibility with old clients but will not be rendered.

Answer tie-back rule: At least 2 time-savers must directly address something the user named in their answers. If they said writing takes most of their time, one title and description must be explicitly about their type of writing.

ROI calculation:
- Total hours saved per week (sum of all 5 time-savers)
- Annual hours (weekly x 52)
- Dollar value: look up BLS median annual wage for their specific job title and industry, divide by 2,080 working hours per year, multiply by annual hours saved. Format as "$X,XXX"
- Industry label (1-3 words, e.g., "Human Resources", "Financial Services", "K-12 Education")

Rules:
- No em dashes anywhere
- No jargon
- Write descriptions like a direct colleague sharing a shortcut, not a product feature list
- Each time-saver must be something they could start today
- Never use the word "workflow" or "workflows" anywhere in the output

Return ONLY valid JSON in this exact format:
{
  "timeSavers": [
    {
      "title": "Time-saver name here",
      "description": "2-3 sentence practical description.",
      "tool": "",
      "timeSavedPerWeek": 1.5
    }
  ],
  "roi": {
    "totalHoursPerWeek": 7.5,
    "annualHours": 390,
    "valueAtSalary": "$9,750",
    "industry": "Human Resources"
  }
}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");

  return JSON.parse(cleanJsonResponse(text)) as TimeSaversResponse;
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobTitle, answers, path, jobDescription } = body as {
      jobTitle: string;
      answers: string[];
      path: "A" | "B";
      jobDescription?: string;
    };

    if (!jobTitle || !answers || !path) {
      return NextResponse.json(
        { error: "jobTitle, answers, and path are required" },
        { status: 400 }
      );
    }

    let result: TimeSaversResponse;

    // Model-agnostic enforcement (S112-F25/F32). Strips any specific AI tool
    // names that may leak through from the LLM or mock data. Runs on every
    // path, including mocks and retry, so the client never sees tool names.
    const stripToolNames = (res: TimeSaversResponse): TimeSaversResponse => {
      const BANNED = /\b(claude|chatgpt|gpt-?\d*|openai|anthropic|gemini|bard|perplexity|notion ai|copilot|llama|mistral|grok)\b/gi;
      return {
        ...res,
        timeSavers: res.timeSavers.map((ts) => ({
          ...ts,
          title: ts.title.replace(BANNED, "AI").replace(/\s{2,}/g, " ").trim(),
          description: ts.description.replace(BANNED, "AI").replace(/\s{2,}/g, " ").trim(),
          tool: "",
        })),
      };
    };

    // Reserved-terminology enforcement (S115-F46). "Workflow" / "workflows"
    // is reserved exclusively for AGENT: Workflow (paid tool). Defensive
    // safety net: if the model slips, rewrite to "time-saver" / "time-savers"
    // before returning. Logs a warning so we can tell when the model drifts.
    const stripReservedTerms = (res: TimeSaversResponse): TimeSaversResponse => {
      const RESERVED = /\bworkflows?\b/gi;
      let fired = false;
      const rewrite = (s: string): string => {
        if (RESERVED.test(s)) fired = true;
        return s.replace(RESERVED, (match) => {
          const isPlural = match.toLowerCase() === "workflows";
          const isCapitalized = match[0] === match[0].toUpperCase();
          if (isPlural) return isCapitalized ? "Time-savers" : "time-savers";
          return isCapitalized ? "Time-saver" : "time-saver";
        });
      };
      const mapped = {
        ...res,
        timeSavers: res.timeSavers.map((ts) => ({
          ...ts,
          title: rewrite(ts.title),
          description: rewrite(ts.description),
        })),
      };
      if (fired) {
        console.warn("[time-savers] stripReservedTerms fired: model emitted a reserved term ('workflow'). Check system prompt.");
      }
      return mapped;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      result = getMockTimeSavers(jobTitle);
    } else {
      try {
        result = await generateTimeSaversWithClaude(jobTitle, answers, path, jobDescription);
      } catch (firstErr) {
        if (firstErr instanceof SyntaxError || (firstErr instanceof Error && firstErr.message.includes("No JSON found"))) {
          console.warn("[time-savers] First attempt failed, retrying with assistant prefill:", firstErr instanceof Error ? firstErr.message : String(firstErr));
          const Anthropic = (await import("@anthropic-ai/sdk")).default;
          const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
          const answersSection = answers.map((a: string, i: number) => `Q${i + 1}: ${a}`).join("\n");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const retryMsg = await (client.messages.create as any)({
            model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
            max_tokens: 16000,
            system: "You recommend AI time-savers for corporate professionals. Never use the word 'workflow' or 'workflows' — use 'time-saver' / 'time-savers' instead. Return ONLY valid JSON.",
            messages: [
              { role: "user", content: `Generate 5 AI time-saver recommendations for a "${jobTitle}" who answered:\n${answersSection}\n\nReturn valid JSON with "timeSavers" array and "roi" object. Do not use the word "workflow". Start with {` },
              { role: "assistant", content: "{" },
            ],
          });
          const retryText = (retryMsg.content as Array<{ type: string; text?: string }>)
            .filter((block: { type: string }) => block.type === "text")
            .map((block: { text?: string }) => block.text!)
            .join("");
          result = JSON.parse(cleanJsonResponse("{" + retryText)) as TimeSaversResponse;
        } else {
          throw firstErr;
        }
      }
    }

    return NextResponse.json(stripReservedTerms(stripToolNames(result)));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[time-savers] API error:", msg, error);
    return NextResponse.json(
      { error: "Failed to generate time-savers" },
      { status: 500 }
    );
  }
}
