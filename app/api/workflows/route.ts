import { NextRequest, NextResponse } from "next/server";
import { cleanJsonResponse } from "../_shared/cleanJson";

// NOTE (S115, F46): This route path `/api/workflows` is kept as-is to avoid a
// migration. The URL is internal plumbing and does not leak to users. All
// types, variables, copy, and system-prompt output use "time-savers"
// terminology. "Workflow" / "workflows" is reserved exclusively for
// AGENT: Workflow (the dual-mode paid tool: $49 one-time / $99 annually).
// See master spec Layer 1 §1.1.

export const maxDuration = 300; // Vercel Pro max; adaptive thinking can exceed 120s

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TimeSaver {
  title: string;
  trigger: string;   // F41: 15-20 words — when to use it
  prompt: string;     // F41: 35-40 words — the actual prompt body
  outcome: string;    // F41: 15-20 words — what you get back
  description: string; // Deprecated: kept for backwards compat. New output uses trigger/prompt/outcome.
  tool: string; // Deprecated (S112-F25/F32): always "" for model-agnostic output.
  timeSavedPerWeek: number; // hours — minimum 1 (F44)
}

export interface ROI {
  totalHoursPerWeek: number;
  annualHours: number;
  valueAtSalary: string; // formatted string e.g. "$8,400"
  industry: string;
  salarySourceRole: string;  // F43: BLS role name for citation, e.g. "Operations Management"
  salarySourceYear: number;  // F43: BLS data year, e.g. 2024
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
        trigger: "When you have a brief and target audience for any content piece and need a polished first draft fast.",
        prompt: "Hand an AI tool your brief, target audience, and channel. Ask it to draft a complete first pass matching your brand voice, with headers, a hook, and a closing CTA included.",
        outcome: "A polished first draft of any content piece in under 2 minutes, ready for your final edits.",
        description: "Give an AI tool your brief and target audience. Get a polished first draft of any content in under 2 minutes. Works for emails, social posts, landing pages, and blog intros.",
        tool: "",
        timeSavedPerWeek: 3,
      },
      {
        title: "Weekly Performance Summary",
        trigger: "When raw analytics data lands in your inbox and your team needs the key takeaways before standup.",
        prompt: "Paste your raw analytics export into an AI tool. Ask it to summarize the top three trends, flag any anomalies against last week, and list the insights your team needs to hear.",
        outcome: "A clean performance summary with trends, anomalies, and action items ready to share in minutes.",
        description: "Paste your raw analytics data into an AI tool. Ask it to summarize key trends, flag anomalies, and pull out the 3 insights your team actually needs to hear.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Competitor Content Monitoring",
        trigger: "When you need a weekly read on what competitors are publishing, launching, or positioning differently.",
        prompt: "Give an AI research tool your competitor list and ask it to scan recent content, product launches, and messaging shifts. Have it return a summary table with what changed and why it matters.",
        outcome: "A concise competitive brief you can drop into a team channel or share in a meeting.",
        description: "Use an AI research tool to track competitor content, product launches, and positioning changes weekly. Summarize findings in a format you can share with your team in minutes.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Campaign Brief Generator",
        trigger: "When a new campaign kicks off and you need a structured brief before the creative team starts.",
        prompt: "Describe your campaign goal, budget range, and timeline to an AI tool. Ask it to draft a brief with target audience, messaging pillars, channel recommendations, and success metrics.",
        outcome: "A complete creative brief ready for stakeholder review, built in minutes instead of hours.",
        description: "Describe your campaign goal to an AI tool. It drafts a complete creative brief including target audience, messaging pillars, channel recommendations, and success metrics.",
        tool: "",
        timeSavedPerWeek: 1,
      },
      {
        title: "Meeting Prep and Recap System",
        trigger: "Before any stakeholder meeting where you need an agenda, or after one where notes need cleaning up.",
        prompt: "Before the meeting, give an AI tool the attendee list and objectives to draft an agenda with talking points. After, paste your raw notes and ask for a summary with owners and deadlines.",
        outcome: "A ready-to-send agenda before the meeting and a clean action-item recap after, each in under a minute.",
        description: "Before any stakeholder meeting, ask an AI tool to draft an agenda and talking points. After the meeting, paste your notes and get a clean summary with action items in 60 seconds.",
        tool: "",
        timeSavedPerWeek: 1,
      },
    ],
    roi: {
      totalHoursPerWeek: 8,
      annualHours: 416,
      valueAtSalary: "$10,400",
      industry: "Marketing",
      salarySourceRole: "Marketing Managers",
      salarySourceYear: 2024,
    },
  },
  sales: {
    timeSavers: [
      {
        title: "Personalized Outreach at Scale",
        trigger: "When you have a list of prospects and need personalized openers that do not sound like a mass template.",
        prompt: "Give an AI tool a prospect's LinkedIn summary, their company page, and your value prop. Ask it to write a three-sentence personalized opener and a full follow-up email tied to their priorities.",
        outcome: "A custom email ready to send in 30 seconds, with a hook that references their actual work.",
        description: "Give an AI tool a prospect's LinkedIn, company page, and your offer. Get a personalized 3-sentence opener and full email in 30 seconds. Send 5x more quality outreach without sounding like a template.",
        tool: "",
        timeSavedPerWeek: 4,
      },
      {
        title: "Pre-Call Research Brief",
        trigger: "Before any discovery or demo call where you need company intel and likely objections at your fingertips.",
        prompt: "Give an AI research tool the company name and your deal context. Ask it to compile a one-page brief covering their recent news, priorities, likely objections, and three tailored talking points.",
        outcome: "A one-page research brief with company intel, objections, and talking points ready before the call.",
        description: "Before any discovery or demo call, ask an AI research tool to gather intel on the company. Have an AI writing tool turn those findings into a 1-page brief with likely objections, key priorities, and talking points.",
        tool: "",
        timeSavedPerWeek: 2,
      },
      {
        title: "CRM Note Cleaner",
        trigger: "After a call when your notes are messy and you need a clean CRM update with next steps extracted.",
        prompt: "Paste your raw call notes into an AI tool. Ask it to extract the next steps, key quotes, deal stage update, and a two-sentence summary formatted for your CRM fields.",
        outcome: "A clean, structured CRM entry with action items and quotes pulled out, done in under a minute.",
        description: "Paste your messy call notes into an AI tool. Ask it to extract next steps, key quotes, deal stage updates, and a clean summary formatted for your CRM. Done in under a minute.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Follow-Up Sequence Builder",
        trigger: "When a deal stalls and you need a multi-touch follow-up sequence tailored to the prospect's hesitation.",
        prompt: "Describe the deal stage, the prospect's main objection, and your relationship so far. Ask an AI tool to write a three-touch follow-up sequence with varied angles addressing their specific concern.",
        outcome: "A three-email sequence you can schedule immediately, each email tackling the objection from a new angle.",
        description: "Describe where a deal stands and what the prospect's main hesitation is. An AI tool writes a 3-touch follow-up sequence tailored to their objection, not a generic template.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Proposal and Deck Outliner",
        trigger: "When you need to pull together a proposal or deck structure quickly before handing it to the design team.",
        prompt: "Give an AI tool the deal context, the prospect's company background, and your solution details. Ask it to draft a complete proposal outline with section headers, key points per slide, and a recommended flow.",
        outcome: "A full proposal outline or deck structure you can hand to design or fill in yourself, built in minutes.",
        description: "Give an AI tool the deal context, company background, and your solution. It drafts a complete proposal outline or deck structure you can hand to design or fill in yourself.",
        tool: "",
        timeSavedPerWeek: 1,
      },
    ],
    roi: {
      totalHoursPerWeek: 10,
      annualHours: 520,
      valueAtSalary: "$13,000",
      industry: "Sales",
      salarySourceRole: "Sales Managers",
      salarySourceYear: 2024,
    },
  },
  default: {
    timeSavers: [
      {
        title: "First-Draft Writer",
        trigger: "When you are staring at a blank page and need a solid first draft of any document, email, or report.",
        prompt: "Give an AI tool the context, intended audience, and your goal. Ask it to write a complete first draft with structure, tone, and key points already in place for your review.",
        outcome: "A polished first draft of any document in under 3 minutes, ready for your final pass.",
        description: "Give an AI tool context, audience, and goal. Get a polished first draft of any document, email, or report in under 3 minutes. Stop staring at blank pages.",
        tool: "",
        timeSavedPerWeek: 2.5,
      },
      {
        title: "Meeting Prep and Recap System",
        trigger: "Before any meeting where you need an agenda from scattered notes, or after one where action items need capturing.",
        prompt: "Before the meeting, paste your scattered notes and attendee list into an AI tool and ask for a structured agenda with talking points. After, paste raw notes and ask for a clean recap with owners and deadlines.",
        outcome: "A polished agenda before and a clean action-item summary after, each generated in under 60 seconds.",
        description: "Before meetings, ask an AI tool to draft agendas and talking points from your notes. After meetings, paste your notes back and get a clean summary with action items in 60 seconds.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Research Summarizer",
        trigger: "When you need to get up to speed on a topic fast and do not have time to read through multiple sources.",
        prompt: "Give an AI research tool your topic and ask it to pull information from multiple sources. Have it synthesize everything into a concise briefing document with key findings and source references.",
        outcome: "A clean, multi-source briefing document you can use or share immediately, built in minutes.",
        description: "Use an AI research tool to gather information on any topic quickly. Have it synthesize multiple sources into a clean briefing document you can use or share immediately.",
        tool: "",
        timeSavedPerWeek: 1.5,
      },
      {
        title: "Email Inbox Processor",
        trigger: "When a complex email thread lands and you need to figure out what actually requires your response.",
        prompt: "Forward the email thread to an AI tool. Ask it to summarize the full context, identify what specifically needs your reply, and draft a response that addresses each open item.",
        outcome: "A clear summary of the thread plus a draft reply ready to review and send.",
        description: "Forward complex email threads to an AI tool. Ask it to summarize context, identify what you actually need to respond to, and draft a reply. Works for any inbox type.",
        tool: "",
        timeSavedPerWeek: 1,
      },
      {
        title: "Weekly Status Report Builder",
        trigger: "When Friday arrives and you need to turn scattered weekly notes into a polished update for stakeholders.",
        prompt: "Give an AI tool your bullet-point notes from the week and your stakeholder's preferred format. Ask it to turn them into a structured status update with highlights, blockers, and next steps.",
        outcome: "A polished status report in the right format, ready to send to stakeholders in minutes.",
        description: "Give an AI tool your bullet-point notes from the week. Ask it to turn them into a polished status update in whatever format your stakeholders expect.",
        tool: "",
        timeSavedPerWeek: 1,
      },
    ],
    roi: {
      totalHoursPerWeek: 7.5,
      annualHours: 390,
      valueAtSalary: "$7,800",
      industry: "Professional",
      salarySourceRole: "Management Occupations",
      salarySourceYear: 2024,
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
- This applies to every field in the JSON.

CARD COUNT LOCK (F42): You MUST return exactly 5 time-savers. Not 4, not 6. Exactly 5.

THREE-PART CARD STRUCTURE (F41): Every time-saver must include three distinct fields:
- "trigger": 15-20 words describing WHEN to use it (the situation or moment).
- "prompt": 35-40 words of the actual prompt body (what to hand the AI and what to ask for).
- "outcome": 15-20 words describing WHAT you get back.
- Total cap per card: 80 words across all three fields. Be precise, not verbose.

MINIMUM VALUE FLOOR (F44): Every time-saver must save at least 1 hour per week. No sub-1h items. If a potential time-saver would save less than 1h/week, consolidate it with an adjacent item or replace it with a higher-value one.

SALARY SOURCE CITATION (F43): The ROI object must include "salarySourceRole" (the exact BLS occupational category name you used, e.g. "Operations Managers") and "salarySourceYear" (the data year, e.g. 2024). Use the most specific BLS OEWS category that matches the job title. Never use vague labels.`;

  const prompt = `Job Title: "${jobTitle}"${contextSection}

Their answers to follow-up questions:
${answersSection}

Generate exactly 5 AI time-saver recommendations for this person. Each time-saver must be specific to their job title and directly informed by their answers above.

For each time-saver:
- Give it a short, memorable name (3-7 words) that references their specific type of work, not a generic task category. Do NOT include the word "workflow" in the title.
- THREE-PART STRUCTURE (mandatory): Return three separate fields per card:
  * "trigger" (15-20 words): The moment or situation when they would use this.
  * "prompt" (35-40 words): The actual instructions — what to hand AI and what to ask for.
  * "outcome" (15-20 words): What they get back and how fast.
  * Total across all three: 80 words max per card.
- Also include a "description" field that combines all three parts into 2-3 natural sentences (for email/backwards compatibility).
- Estimate realistic hours saved per week (1 to 4 hours — minimum 1 hour, be conservative and credible). No sub-1h items.

MODEL-AGNOSTIC RULE (strict, S112):
- Do NOT name any specific AI tool, model, product, or company anywhere in any field.
- Banned words anywhere in output: Claude, ChatGPT, GPT, OpenAI, Anthropic, Gemini, Bard, Perplexity, Notion AI, Copilot, Llama, Mistral, Grok.
- Refer to "AI", "an AI assistant", "a research AI", or "an AI writing tool" when you need to name the category of tool. Prefer verbs over tool names: "ask AI to summarize", "paste your notes into AI", "have AI draft the reply".
- The "tool" field in the JSON must always be an empty string "".

Answer tie-back rule: At least 2 time-savers must directly address something the user named in their answers. If they said writing takes most of their time, one title and description must be explicitly about their type of writing.

ROI calculation:
- Total hours saved per week (sum of all 5 time-savers, each must be >= 1)
- Annual hours (weekly x 52)
- Dollar value: look up BLS OEWS median annual wage for their specific job title and industry, divide by 2,080 working hours per year, multiply by annual hours saved. Format as "$X,XXX"
- Industry label (1-3 words, e.g., "Human Resources", "Financial Services", "K-12 Education")
- "salarySourceRole": the exact BLS OEWS occupational category name used (e.g. "Operations Managers", "Marketing Managers", "Financial Analysts")
- "salarySourceYear": the data year (e.g. 2024)

Rules:
- No em dashes anywhere
- No jargon
- Write like a direct colleague sharing a shortcut, not a product feature list
- Each time-saver must be something they could start today
- Never use the word "workflow" or "workflows" anywhere in the output
- Exactly 5 time-savers, each saving at least 1h/week

Return ONLY valid JSON in this exact format:
{
  "timeSavers": [
    {
      "title": "Time-saver name here",
      "trigger": "15-20 words on when to use it.",
      "prompt": "35-40 words of the actual prompt body to hand to AI.",
      "outcome": "15-20 words on what you get back.",
      "description": "2-3 sentence combined description for email.",
      "tool": "",
      "timeSavedPerWeek": 1.5
    }
  ],
  "roi": {
    "totalHoursPerWeek": 7.5,
    "annualHours": 390,
    "valueAtSalary": "$9,750",
    "industry": "Human Resources",
    "salarySourceRole": "Human Resources Managers",
    "salarySourceYear": 2024
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

    // F42: Count lock — exactly 5 time-savers. Retry once if wrong count.
    if (result.timeSavers.length !== 5) {
      console.warn(`[time-savers] F42 count lock: got ${result.timeSavers.length}, expected 5. Retrying.`);
      if (process.env.ANTHROPIC_API_KEY) {
        const retryResult = await generateTimeSaversWithClaude(jobTitle, answers, path, jobDescription);
        if (retryResult.timeSavers.length === 5) {
          result = retryResult;
        } else {
          // Trim or pad to exactly 5
          console.warn(`[time-savers] F42 retry still got ${retryResult.timeSavers.length}. Force-trimming to 5.`);
          result = retryResult;
          result.timeSavers = result.timeSavers.slice(0, 5);
        }
      }
    }

    // F44: 1h/week floor — flag any sub-1h item and retry once.
    const hasSubOneHour = result.timeSavers.some((ts) => ts.timeSavedPerWeek < 1);
    if (hasSubOneHour) {
      console.warn("[time-savers] F44 floor violation: at least one item under 1h/week. Retrying.");
      if (process.env.ANTHROPIC_API_KEY) {
        const retryResult = await generateTimeSaversWithClaude(jobTitle, answers, path, jobDescription);
        if (!retryResult.timeSavers.some((ts) => ts.timeSavedPerWeek < 1) && retryResult.timeSavers.length === 5) {
          result = retryResult;
        } else {
          // Force floor: bump any sub-1h items to 1
          console.warn("[time-savers] F44 retry still has sub-1h items. Force-flooring to 1.");
          result.timeSavers = result.timeSavers.map((ts) => ({
            ...ts,
            timeSavedPerWeek: Math.max(1, ts.timeSavedPerWeek),
          }));
        }
      } else {
        // Mock path: force floor
        result.timeSavers = result.timeSavers.map((ts) => ({
          ...ts,
          timeSavedPerWeek: Math.max(1, ts.timeSavedPerWeek),
        }));
      }
      // Recalculate ROI totals after floor enforcement
      const totalHours = result.timeSavers.reduce((sum, ts) => sum + ts.timeSavedPerWeek, 0);
      result.roi.totalHoursPerWeek = totalHours;
      result.roi.annualHours = totalHours * 52;
    }

    // F43: Ensure salarySourceRole and salarySourceYear have defaults
    if (!result.roi.salarySourceRole) {
      result.roi.salarySourceRole = result.roi.industry || "All Occupations";
    }
    if (!result.roi.salarySourceYear) {
      result.roi.salarySourceYear = 2024;
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
