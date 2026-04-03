import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Workflow {
  title: string;
  description: string;
  tool: string;
  timeSavedPerWeek: number; // hours
}

export interface ROI {
  totalHoursPerWeek: number;
  annualHours: number;
  valueAtSalary: string; // formatted string e.g. "$8,400"
  industry: string;
}

export interface WorkflowsResponse {
  workflows: Workflow[];
  roi: ROI;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_WORKFLOWS: Record<string, WorkflowsResponse> = {
  marketing: {
    workflows: [
      {
        title: "First-Draft Content Machine",
        description:
          "Give Claude your brief and target audience. Get a polished first draft of any content in under 2 minutes. Works for emails, social posts, landing pages, and blog intros.",
        tool: "Claude",
        timeSavedPerWeek: 3,
      },
      {
        title: "Weekly Performance Summary",
        description:
          "Paste your raw analytics data into Claude. Ask it to summarize key trends, flag anomalies, and pull out the 3 insights your team actually needs to hear.",
        tool: "Claude",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Competitor Content Monitoring",
        description:
          "Use Perplexity to track competitor content, product launches, and positioning changes weekly. Summarize findings in a format you can share with your team in minutes.",
        tool: "Perplexity",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Campaign Brief Generator",
        description:
          "Describe your campaign goal to Claude. It drafts a complete creative brief including target audience, messaging pillars, channel recommendations, and success metrics.",
        tool: "Claude",
        timeSavedPerWeek: 1,
      },
      {
        title: "Meeting Prep + Recap System",
        description:
          "Before any stakeholder meeting, ask Claude to draft an agenda and talking points. After the meeting, paste your notes and get a clean summary with action items in 60 seconds.",
        tool: "Claude",
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
    workflows: [
      {
        title: "Personalized Outreach at Scale",
        description:
          "Give Claude a prospect's LinkedIn, company page, and your offer. Get a personalized 3-sentence opener and full email in 30 seconds. Send 5x more quality outreach without sounding like a template.",
        tool: "Claude",
        timeSavedPerWeek: 4,
      },
      {
        title: "Pre-Call Research Brief",
        description:
          "Before any discovery or demo call, ask Perplexity to research the company. Ask Claude to turn those findings into a 1-page brief with likely objections, key priorities, and talking points.",
        tool: "Claude + Perplexity",
        timeSavedPerWeek: 2,
      },
      {
        title: "CRM Note Cleaner",
        description:
          "Paste your messy call notes into Claude. Ask it to extract next steps, key quotes, deal stage updates, and a clean summary formatted for your CRM. Done in under a minute.",
        tool: "Claude",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Follow-Up Sequence Builder",
        description:
          "Describe where a deal stands and what the prospect's main hesitation is. Claude writes a 3-touch follow-up sequence tailored to their objection — not a generic template.",
        tool: "Claude",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Proposal and Deck Outliner",
        description:
          "Give Claude the deal context, company background, and your solution. It drafts a complete proposal outline or deck structure you can hand to design or fill in yourself.",
        tool: "Claude",
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
    workflows: [
      {
        title: "First-Draft Writer",
        description:
          "Give Claude context, audience, and goal. Get a polished first draft of any document, email, or report in under 3 minutes. Stop staring at blank pages.",
        tool: "Claude",
        timeSavedPerWeek: 2.5,
      },
      {
        title: "Meeting Prep + Recap System",
        description:
          "Before meetings, ask Claude to draft agendas and talking points from your notes. After meetings, paste your notes back and get a clean summary with action items in 60 seconds.",
        tool: "Claude",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Research Summarizer",
        description:
          "Use Perplexity to gather information on any topic quickly. Ask Claude to synthesize multiple sources into a clean briefing document you can use or share immediately.",
        tool: "Claude + Perplexity",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Email Inbox Processor",
        description:
          "Forward complex email threads to Claude. Ask it to summarize context, identify what you actually need to respond to, and draft a reply. Works for any inbox type.",
        tool: "Claude",
        timeSavedPerWeek: 1,
      },
      {
        title: "Weekly Status Report Builder",
        description:
          "Give Claude your bullet-point notes from the week. Ask it to turn them into a polished status update in whatever format your stakeholders expect.",
        tool: "Claude",
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

function getMockWorkflows(jobTitle: string): WorkflowsResponse {
  const category = getJobCategory(jobTitle);
  return MOCK_WORKFLOWS[category] ?? MOCK_WORKFLOWS["default"];
}

// ─── Claude API Call ──────────────────────────────────────────────────────────
async function generateWorkflowsWithClaude(
  jobTitle: string,
  answers: string[],
  path: "A" | "B",
  jobDescription?: string
): Promise<WorkflowsResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const contextSection = jobDescription
    ? `\nJob Description:\n${jobDescription.slice(0, 3000)}`
    : "";
  const answersSection = answers.map((a, i) => `Q${i + 1}: ${a}`).join("\n");

  const systemPrompt = `You are an expert at helping corporate professionals understand exactly how AI can replace manual, time-consuming work in their specific job. You know which AI tools are best suited for which tasks, you write in plain language, and you produce recommendations that feel like they were written by a colleague who knows their role inside out. Not a generic AI assistant.`;

  const prompt = `Job Title: "${jobTitle}"${contextSection}

Their answers to follow-up questions:
${answersSection}

Generate exactly 5 AI workflow recommendations for this person. Each workflow must be specific to their job title and directly informed by their answers above.

For each workflow:
- Give it a short, memorable name (3-7 words) that references their specific type of work, not a generic task category
- Write 2-3 sentences using this structure: (1) Start with the trigger — when they would use this, or what they hand to the AI. (2) Describe the exact action — what to give it and how to use it. (3) State the concrete outcome — what they get back and how fast.
- Name the specific AI tool best suited for this task (Claude, Perplexity, Notion AI, Gemini, ChatGPT, etc.)
- Estimate realistic hours saved per week (0.5 to 4 hours — be conservative and credible)

Tool variety rule: Do not assign Claude to all 5 workflows. Vary tools where they genuinely fit better. Perplexity is better for research and monitoring. Notion AI is better for notes, databases, and documentation. Use judgment based on what the task actually requires.

Answer tie-back rule: At least 2 workflows must directly address something the user named in their answers. If they said writing takes most of their time, one workflow title and description must be explicitly about their type of writing. If they said they are just starting with AI, write all descriptions at a beginner-friendly level with clear, literal instructions.

ROI calculation:
- Total hours saved per week (sum of all 5 workflows)
- Annual hours (weekly x 52)
- Dollar value: look up BLS median annual wage for their specific job title and industry, divide by 2,080 working hours per year, multiply by annual hours saved. Format as "$X,XXX"
- Industry label (1-3 words, e.g., "Human Resources", "Financial Services", "K-12 Education")

Rules:
- No em dashes anywhere
- No jargon
- Write descriptions like a direct colleague sharing a shortcut, not a product feature list
- Each workflow must be something they could start today

Return ONLY valid JSON in this exact format:
{
  "workflows": [
    {
      "title": "Workflow name here",
      "description": "2-3 sentence practical description.",
      "tool": "Tool name",
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
    model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 3000,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Claude response");

  return JSON.parse(jsonMatch[0]) as WorkflowsResponse;
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

    let result: WorkflowsResponse;

    if (!process.env.ANTHROPIC_API_KEY) {
      result = getMockWorkflows(jobTitle);
    } else {
      result = await generateWorkflowsWithClaude(
        jobTitle,
        answers,
        path,
        jobDescription
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Workflows API error:", error);
    return NextResponse.json(
      { error: "Failed to generate workflows" },
      { status: 500 }
    );
  }
}
