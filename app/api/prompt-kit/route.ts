import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PromptItem {
  title: string;
  prompt: string;
  why: string;
}

export interface PromptCategory {
  name: string;
  prompts: PromptItem[];
}

export interface PromptKitResponse {
  categories: PromptCategory[];
  aiProfile: string;
}

// ─── Mock fallback ─────────────────────────────────────────────────────────────
const MOCK_KIT: PromptKitResponse = {
  aiProfile:
    "I'm a marketing professional who primarily handles writing and communication. I'm still getting started with AI tools and finding my footing. My biggest challenge is not knowing what to ask to get results that feel specific to my work. When helping me, please keep things practical and suggest what to say to get a great result — examples from marketing and communications work are especially helpful.",
  categories: [
    {
      name: "Writing & Communication",
      prompts: [
        {
          title: "First-Draft Generator",
          prompt:
            "I need to write a [type of document] for [audience]. The goal is to [desired outcome]. My tone should be [professional/friendly/direct]. Here are the key points I want to cover: [bullet your points]. Please write a clear, polished first draft I can edit.",
          why: "This works because giving the AI your audience, goal, tone, and key points eliminates guesswork and produces a draft you can actually use.",
        },
        {
          title: "Email Rewriter",
          prompt:
            "Here is a draft email I wrote: [paste email]. Please rewrite it to sound more [concise/professional/warm]. Keep the core message but make it clearer and easier to read. Remove any unnecessary words.",
          why: "This works because you're anchoring the AI to your existing draft instead of starting from scratch, so your intent stays intact.",
        },
        {
          title: "Summary Builder",
          prompt:
            "Here is a long document/thread/report: [paste content]. Please summarize it in 3-5 bullet points. Then write one sentence that captures the single most important takeaway. Keep it simple enough that I could explain it to someone in 30 seconds.",
          why: "This works because the two-part structure forces the AI to distill and prioritize, not just compress.",
        },
      ],
    },
    {
      name: "Analysis & Research",
      prompts: [
        {
          title: "Data Explainer",
          prompt:
            "Here is some data or a report: [paste content]. I am a [your job title] and I need to understand what this means for [context]. Please explain the most important findings in plain language. Highlight anything I should pay attention to or be concerned about.",
          why: "This works because role context helps the AI filter for what actually matters to your job, not just a generic summary.",
        },
        {
          title: "Comparison Table",
          prompt:
            "I need to compare [option A] and [option B] for [decision or purpose]. Please create a simple table comparing them on these criteria: [list 3-5 criteria]. Then give me a one-paragraph recommendation based on my situation: [brief context].",
          why: "This works because the table format forces structured thinking, and the recommendation paragraph gives you something to act on.",
        },
        {
          title: "Research Briefing",
          prompt:
            "Please research [topic] and give me a briefing document. Include: what it is, why it matters for [my industry/role], 3 key facts or stats, and 2-3 things I should know before [meeting/decision/conversation]. Keep it under 300 words.",
          why: "This works because a word limit and specific sections prevent the AI from overwhelming you with information you don't need.",
        },
      ],
    },
    {
      name: "Planning & Strategy",
      prompts: [
        {
          title: "Project Plan Builder",
          prompt:
            "I need to plan [project or initiative]. The goal is [outcome]. My deadline is [date] and my team is [size/roles]. Please break this into clear phases with key milestones, suggested owners, and potential risks I should watch for.",
          why: "This works because naming the deadline and team forces the AI to make the plan realistic, not theoretical.",
        },
        {
          title: "Agenda Generator",
          prompt:
            "I am running a [type of meeting] with [attendees/roles]. The goal of this meeting is [outcome]. We have [X] minutes. Please create a structured agenda with time allocations, a clear objective for each segment, and 2-3 questions to keep the discussion focused.",
          why: "This works because outcome-first agendas keep meetings from drifting, and the AI builds the structure around your goal.",
        },
        {
          title: "Decision Framework",
          prompt:
            "I need to decide between [option A] and [option B]. Here is my situation: [2-3 sentences of context]. What are the top 3 arguments for each option? What am I likely not considering? What decision would you recommend and why?",
          why: "This works because asking what you might be missing is one of the highest-value things you can do with an AI — it surfaces blind spots quickly.",
        },
      ],
    },
    {
      name: "Day-to-Day Efficiency",
      prompts: [
        {
          title: "Meeting Recap Writer",
          prompt:
            "Here are my rough notes from a meeting: [paste notes]. Please turn these into a clean meeting recap with: a 2-sentence summary, key decisions made, action items with owners, and any open questions. Format it so I can paste it into an email.",
          why: "This works because rough notes plus a clear output format is all the AI needs — it does the cleanup work so you don't have to.",
        },
        {
          title: "Response Drafter",
          prompt:
            "I received this message: [paste message]. I want to respond by [your intent — agreeing, declining, asking for more info, etc.]. My relationship with this person is [colleague/client/manager]. Please draft a response that sounds natural and professional, around [X] sentences long.",
          why: "This works because specifying your intent and relationship prevents the AI from defaulting to generic corporate language.",
        },
        {
          title: "Weekly Update Builder",
          prompt:
            "Here are my bullet points from this week: [paste bullets]. Please turn these into a polished weekly status update for my [manager/team]. Highlight wins, note anything in progress, and flag any blockers. Keep it under 200 words and easy to skim.",
          why: "This works because the AI's job is formatting and language — you provide the substance, it handles the polish.",
        },
      ],
    },
  ],
};

// ─── Claude API Call ──────────────────────────────────────────────────────────
async function generatePromptKit(
  jobTitle: string,
  workType: string,
  aiUsage: string,
  challenge: string,
  jobDescription?: string
): Promise<PromptKitResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are an AI prompt coach helping non-technical professionals build a personal library of ready-to-use AI prompts. Your prompts must be immediately usable — paste into ChatGPT or Claude and get a great result with zero editing required.`;

  const userPrompt = `Build a personalized AI Prompt Kit for this person:

Job Title: "${jobTitle}"
Main work type: "${workType}"
Current AI usage: "${aiUsage}"
Biggest challenge with AI: "${challenge}"${jobDescription ? `\n\nJob description (use this for additional context about their actual responsibilities):\n${jobDescription.substring(0, 2000)}` : ""}

Generate exactly 4 prompt categories with 3 prompts each (12 total). Choose categories that are most relevant to their work type and job title. Each prompt should directly address their stated challenge.

For each prompt:
- Give it a short, memorable name (3-6 words)
- Write the actual ready-to-use prompt. Use [brackets] for things the user fills in. Write it in first-person as if the user is speaking to an AI. Make it specific enough to get a great result, not a generic template. 2-5 sentences.
- Add a one-line "why it works" explanation that starts with "This works because..."

Also write an AI Profile paragraph for this person. This is a 3-4 sentence paragraph they will paste into their AI tool's Custom Instructions so AI always knows who they are before they say a word. Write it in first person ("I am a..."). Include: their job title, what kind of work they do, their current AI experience level, and one specific instruction for how AI should help them based on their challenge. Make it feel personal and natural, not like a form was filled out. No em dashes.

Rules:
- Make prompts specific to their job title — not generic advice
- No em dashes anywhere
- No jargon
- Every prompt must be something they could copy and use TODAY in ChatGPT or Claude
- Calibrate complexity to their AI usage level (beginners get simpler prompts, daily users get more advanced ones)
- Address their stated challenge in at least 3 of the 12 prompts

Return ONLY valid JSON in this exact format:
{
  "aiProfile": "3-4 sentence AI profile paragraph here.",
  "categories": [
    {
      "name": "Category Name",
      "prompts": [
        {
          "title": "Prompt name here",
          "prompt": "The actual ready-to-use prompt text here with [fill-in brackets].",
          "why": "This works because..."
        }
      ]
    }
  ]
}`;

  const message = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Claude response");

  return JSON.parse(jsonMatch[0]) as PromptKitResponse;
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobTitle, workType, aiUsage, challenge, jobDescription } = body as {
      jobTitle: string;
      workType: string;
      aiUsage: string;
      challenge: string;
      jobDescription?: string;
    };

    if (!jobTitle || !workType || !aiUsage || !challenge) {
      return NextResponse.json(
        { error: "jobTitle, workType, aiUsage, and challenge are required" },
        { status: 400 }
      );
    }

    let result: PromptKitResponse;

    if (!process.env.ANTHROPIC_API_KEY) {
      result = MOCK_KIT;
    } else {
      result = await generatePromptKit(jobTitle, workType, aiUsage, challenge, jobDescription);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Prompt Kit API error:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt kit" },
      { status: 500 }
    );
  }
}
