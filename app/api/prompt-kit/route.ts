import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // Vercel Pro max; adaptive thinking can exceed 120s

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

  const systemPrompt = `You are an AI prompt coach. Your job: build 12 ready-to-use prompts tailored to one specific professional. These prompts should feel like they were written by someone who knows their job — not generated by a template engine.

A great prompt has four qualities. Every prompt you write must include at least three of them:

1. Context — tells AI who the user is and what situation they're in, before the task. Not after. Example: "I am a Senior HR Business Partner at a 300-person company and I am managing a performance conversation with a direct report who has missed three consecutive deadlines..."
2. Clear task — one specific ask. Not a compound request with multiple questions buried inside.
3. Format instruction — tells AI exactly what the output should look like: length, structure, format, or medium. "Give me three options, each in two sentences." "Keep it under 150 words." "Format this as a bulleted list I can paste directly into Slack."
4. Purpose or audience — who is this for, and what does it need to accomplish? "So my VP can make a go/no-go decision before the 10am call" changes everything about how AI responds.

The test: can a [job title] paste this into an AI tool right now, with zero editing, and get something they would actually use at work? If they would have to stop and think about what to fill in first, or rewrite the prompt before using it, it is too generic. Build tighter.

Tool name rule: Never name a specific AI tool (ChatGPT, Claude, Gemini, Perplexity, etc.) inside any prompt text. The prompts must be tool-agnostic so the user can paste them into whatever tool they prefer. Do not write "Using Claude for this because..." or "Open ChatGPT and..." — just write the prompt. The AI Profile paragraph is the one exception: it may mention the user's stated AI tool by name, since the profile is a self-description.`;

  const toolVarianceInstruction = "";

  const complexityInstruction = aiUsage === "I haven't started using AI tools yet"
    ? `Complexity level: BEGINNER. Short prompts only. Simple context-setting, one task per prompt, no jargon, no advanced techniques. These should feel completely approachable to someone using AI for the first time. Their first win matters more than a complete picture.`
    : aiUsage === "I try it sometimes, but results feel hit or miss"
    ? `Complexity level: EARLY. Include one concrete tip in each "why it works" explanation about what specifically makes this prompt work better than what they have likely been doing. Help them see the difference.`
    : aiUsage === "I use it a few times a week"
    ? `Complexity level: INTERMEDIATE. Include explicit format instructions in every prompt. Model the context-first habit: every prompt should open with a sentence about who the user is and what they are working on before the task.`
    : `Complexity level: ADVANCED. Include constraints, specificity, and chaining hints. Prompts can be more sophisticated: introduce role-priming, output constraints, and multi-step prompts that build on each other.`;

  const userPrompt = `Build a personalized AI Prompt Kit for this person:

Job Title: "${jobTitle}"
Main work type: "${workType}"
Current AI usage: "${aiUsage}"
Biggest challenge with AI: "${challenge}"${jobDescription ? `\n\nJob description — mine this actively:\n${jobDescription.substring(0, 2000)}\nPull 2-3 specific responsibilities, deliverables, or terms directly from this job description and use their actual language in at least 3 prompts. If they call it a "talent review," the prompt says "talent review." If they manage "HRIS reporting," the prompt uses that exact term. Do not paraphrase their job into generic language.` : ""}

Pre-generation step — do this before writing any prompts:
Identify 8 specific work situations that are real and recurring for a ${jobTitle}. Think: what are the actual deliverables, meetings, decisions, and tasks that come up in this job week after week? Not generic work activities — situations specific enough that a different job title would not face them in the same way. Write these out internally, then build your 12 prompts from this list. Do not start generating prompts until you have grounded yourself in this person's actual job.

Generate exactly 4 prompt categories with 3 prompts each (12 total).

Category naming rule: Name your 4 categories using the vocabulary of their actual job — the words they use at work, not abstract labels. A nurse's categories should sound different from an account executive's. An HR manager's categories should use HR terms. A marketing manager's categories should use marketing terms. The category name should make the user think "yes, this is exactly for my job" the moment they read it.

Work type rule: Their main work type is "${workType}". This should shape the flavor of the prompt text itself, not just which categories you choose. Someone doing "Customer or Client-Facing Work" should have prompts that regularly reference clients, stakeholders, or external relationships in the prompt text. Someone doing "Teaching or Training Others" should have prompts built around explaining, facilitating, and developing others. Someone doing "Analysis & Research" should have prompts that reference data, findings, and decisions. The work type should be visible in the prompts — not just implied by the category name.

For each prompt:
- Give it a short, memorable name (3-6 words)
- Write the actual ready-to-use prompt. Use [brackets] for things the user fills in at runtime — names, dates, specific project details, quantities. The job title "${jobTitle}" is already known: write it directly into the prompt text, do not use [job title] as a bracket. Write in first-person as if the user is speaking to an AI. Every prompt must include at least 3 of the 4 qualities from your instructions: context, clear task, format instruction, purpose or audience. 2-5 sentences.
- Add a "why it works" explanation that starts with "This works because..." In at least 3 of the 12 prompts, explicitly connect the explanation back to their stated challenge by name. Do not make them infer the connection — state it directly.

Self-check rule: Before outputting your JSON, test each prompt against this question: would this exact prompt work equally well for a nurse and an account executive? If yes, it is too generic — revise it. A prompt that passes the test is one that only makes full sense for a ${jobTitle}.

Also write an AI Profile paragraph for this person. This is a 3-4 sentence paragraph they will paste into their AI tool's Custom Instructions so AI always knows who they are before they say a word. Write it in first person ("I am a..."). It must deliberately synthesize all four of their answers — not just the job title:
- Job title: "${jobTitle}" — state it directly in the opening sentence
- Main work type: "${workType}" — incorporate this into the second sentence using phrasing like "I spend most of my working time on [workType]." or "Most of my work involves [workType]." Do not use a percentage. Do not write "who spends X of my working time."
- AI experience: "${aiUsage}" — reflect honestly where they are in their AI journey, in plain language
- Their challenge: "${challenge}" — close with one specific behavioral instruction for AI based on this: what should AI always do, or always avoid, to help this person get better results?
The person reading this profile should immediately recognize themselves in every sentence. It should feel like it was written by someone who interviewed them, not generated from a form. No em dashes.

${complexityInstruction}${toolVarianceInstruction}

Rules:
- No em dashes anywhere
- No jargon
- Every prompt must be something they could copy and use TODAY
- Address their stated challenge directly in at least 3 of the 12 prompts
- Never name a prompt after an email task. Avoid titles containing "Email Writer", "Email Drafter", or "Email Rewriter". Name prompts by the deliverable or outcome instead (e.g. "Project Status Brief", "Scope Change Response", "Stakeholder Briefing", "Meeting Recap Builder")

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = (message.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");

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
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[prompt-kit] API error:", msg, error);
    return NextResponse.json(
      { error: "Failed to generate prompt kit" },
      { status: 500 }
    );
  }
}
