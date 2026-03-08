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

  const prompt = `You are helping a non-technical professional discover how AI can save them time in their specific job.

Job Title: "${jobTitle}"${contextSection}

Their answers to follow-up questions:
${answersSection}

Generate exactly 5 personalized AI workflow recommendations based on their specific role and answers. These should be immediately actionable — not vague advice.

For each workflow:
- Give it a short, memorable name (3-7 words)
- Write a 2-3 sentence description explaining exactly how to use it in their job
- Name the specific AI tool (Claude, Perplexity, Notion AI, Gemini, ChatGPT, etc.)
- Estimate realistic hours saved per week (0.5 to 4 hours — be conservative and credible)

Also calculate ROI:
- Total hours saved per week (sum of all 5 workflows)
- Annual hours (weekly x 52)
- Dollar value using publicly available average salary data for their industry/role
- Industry label (1-2 words)

Rules:
- Be specific to their actual role and answers — not generic
- No em dashes
- No jargon
- Each workflow must be something they could start TODAY
- Keep descriptions direct and practical

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
    "industry": "Marketing"
  }
}`;

  const message = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

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
