"use client";

import { useState } from "react";
import type { PromptKitResponse } from "@/app/api/prompt-kit/route";

// ─── Constants ────────────────────────────────────────────────────────────────
const WORK_TYPES = [
  "Writing & Communication",
  "Analysis & Research",
  "Planning & Managing Projects",
  "Customer or Client-Facing Work",
  "Teaching or Training Others",
];

const AI_USAGE_OPTIONS = [
  "I haven't started using AI tools yet",
  "I try it sometimes, but results feel hit or miss",
  "I use it a few times a week",
  "I use it daily but want better results",
];

const CHALLENGES = [
  "I don't know what to ask it",
  "The results feel too generic for my job",
  "Too much back-and-forth to get what I need",
  "I'm not sure which AI tool to use for what",
];

type Screen = "intro" | "q1" | "q2" | "q3" | "q4" | "loading" | "results";
const QUESTION_SCREENS: Screen[] = ["q1", "q2", "q3", "q4"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function PromptBuilderTool() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [jobTitle, setJobTitle] = useState("");
  const [workType, setWorkType] = useState("");
  const [aiUsage, setAiUsage] = useState("");
  const [challenge, setChallenge] = useState("");
  const [promptKit, setPromptKit] = useState<PromptKitResponse | null>(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showWriteIn, setShowWriteIn] = useState(false);
  const [writeInValue, setWriteInValue] = useState("");

  // ── Helpers ────────────────────────────────────────────────────
  const progressIndex = QUESTION_SCREENS.indexOf(screen);

  const resetWriteIn = () => {
    setShowWriteIn(false);
    setWriteInValue("");
  };

  const toggleWriteIn = () => {
    setShowWriteIn((prev) => !prev);
    setWriteInValue("");
  };

  const handleGenerate = async (finalChallenge: string) => {
    setScreen("loading");
    setError("");
    try {
      const res = await fetch("/api/prompt-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          workType,
          aiUsage,
          challenge: finalChallenge,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setPromptKit(data);

      // TODO: Insert Stripe paywall here between loading and results.
      // When Stripe is ready:
      //   1. Set screen to "paywall" (show blurred preview + $4.99 CTA)
      //   2. On successful payment, verify webhook and set screen to "results"
      // For now, skip directly to results.
      setScreen("results");
    } catch {
      setError("Something went wrong. Please try again.");
      setScreen("q4");
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEmailSubmit = async () => {
    if (!email || !promptKit) return;
    setEmailLoading(true);
    try {
      await fetch("/api/prompt-kit-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, jobTitle, promptKit }),
      });
    } catch {
      // Fail silently — email is a nice-to-have, not a blocker
    }
    setEmailSubmitted(true);
    setEmailLoading(false);
  };

  // ── Progress Bar ───────────────────────────────────────────────
  const ProgressBar = () => (
    <div className="progress-bar">
      {QUESTION_SCREENS.map((s, i) => (
        <div
          key={s}
          className={`progress-pip ${
            i < progressIndex ? "done" : i === progressIndex ? "active" : ""
          }`}
        />
      ))}
    </div>
  );

  // ── Screen: Intro ──────────────────────────────────────────────
  if (screen === "intro") {
    return (
      <div className="tool-container">
        <div className="screen">
          <p className="tool-tag">AGENT: Prompt Builder</p>
          <h1 className="screen-headline">
            Build your personal AI&nbsp;Prompt Kit.
          </h1>
          <p className="screen-subheadline">
            Answer 4 quick questions. Get 12 ready-to-copy AI prompts built
            around your exact job and how you actually work.
          </p>

          <div className="pb-perks">
            {[
              "12 prompts personalized to your job title",
              "Organized by category — writing, analysis, planning and more",
              "One-click copy. Paste into ChatGPT or Claude and go.",
              "Emailed to you so you keep it forever",
            ].map((perk) => (
              <div key={perk} className="pb-perk">
                <span className="perk-check">✓</span>
                <span>{perk}</span>
              </div>
            ))}
          </div>

          <div className="pb-price-row">
            <span className="pb-price">$4.99</span>
            <span className="pb-price-note">One time · No subscription</span>
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={() => setScreen("q1")}
          >
            Build My Prompt Kit →
          </button>
          <p
            style={{
              marginTop: "12px",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            Takes about 2 minutes
          </p>
        </div>
      </div>
    );
  }

  // ── Screen: Q1 — Job Title ─────────────────────────────────────
  if (screen === "q1") {
    return (
      <div className="tool-container">
        <div className="screen">
          <p className="tool-tag">AGENT: Prompt Builder</p>
          <ProgressBar />
          <p className="step-label">Question 1 of 4</p>
          <p className="question-stem">What&apos;s your job title?</p>
          <p className="question-subheadline">
            Be specific. &ldquo;Senior HR Manager&rdquo; is better than
            &ldquo;HR.&rdquo;
          </p>
          <input
            type="text"
            className="input"
            placeholder="e.g. Marketing Manager, Account Executive, Nurse Practitioner..."
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && jobTitle.trim() && setScreen("q2")
            }
            autoFocus
          />
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "16px" }}
            onClick={() => setScreen("q2")}
            disabled={!jobTitle.trim()}
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  // ── Screen: Q2 — Work Type ─────────────────────────────────────
  if (screen === "q2") {
    const canAdvanceQ2 = showWriteIn ? writeInValue.trim().length > 0 : workType !== "";
    const advanceQ2 = (value: string) => {
      setWorkType(value);
      resetWriteIn();
      setScreen("q3");
    };

    return (
      <div className="tool-container">
        <div className="screen">
          <p className="tool-tag">AGENT: Prompt Builder</p>
          <ProgressBar />
          <p className="step-label">Question 2 of 4</p>
          <p className="question-stem">
            What best describes most of your work?
          </p>
          <p className="question-subheadline">Pick the one that fits closest.</p>
          <div className="choices">
            {WORK_TYPES.map((option) => (
              <button
                key={option}
                className={`choice ${workType === option && !showWriteIn ? "selected" : ""}`}
                onClick={() => {
                  resetWriteIn();
                  setWorkType(option);
                  setTimeout(() => advanceQ2(option), 180);
                }}
              >
                <span className="choice-dot" />
                {option}
              </button>
            ))}
          </div>
          {showWriteIn ? (
            <>
              <input
                type="text"
                className="input"
                style={{ marginBottom: "12px" }}
                placeholder="Describe your work in a few words..."
                value={writeInValue}
                onChange={(e) => setWriteInValue(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && writeInValue.trim() && advanceQ2(writeInValue.trim())
                }
                autoFocus
              />
              <button
                className="btn btn-primary btn-full"
                onClick={() => advanceQ2(writeInValue.trim())}
                disabled={!canAdvanceQ2}
              >
                Next →
              </button>
            </>
          ) : (
            <button className="write-in-toggle" onClick={toggleWriteIn} type="button">
              <span>+</span> Something else? Write it in.
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Screen: Q3 — AI Usage ──────────────────────────────────────
  if (screen === "q3") {
    const canAdvanceQ3 = showWriteIn ? writeInValue.trim().length > 0 : aiUsage !== "";
    const advanceQ3 = (value: string) => {
      setAiUsage(value);
      resetWriteIn();
      setScreen("q4");
    };

    return (
      <div className="tool-container">
        <div className="screen">
          <p className="tool-tag">AGENT: Prompt Builder</p>
          <ProgressBar />
          <p className="step-label">Question 3 of 4</p>
          <p className="question-stem">
            How do you currently use AI tools like ChatGPT or Claude?
          </p>
          <p className="question-subheadline">
            Be honest — this helps us calibrate your prompts.
          </p>
          <div className="choices">
            {AI_USAGE_OPTIONS.map((option) => (
              <button
                key={option}
                className={`choice ${aiUsage === option && !showWriteIn ? "selected" : ""}`}
                onClick={() => {
                  resetWriteIn();
                  setAiUsage(option);
                  setTimeout(() => advanceQ3(option), 180);
                }}
              >
                <span className="choice-dot" />
                {option}
              </button>
            ))}
          </div>
          {showWriteIn ? (
            <>
              <input
                type="text"
                className="input"
                style={{ marginBottom: "12px" }}
                placeholder="Describe your current AI usage..."
                value={writeInValue}
                onChange={(e) => setWriteInValue(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && writeInValue.trim() && advanceQ3(writeInValue.trim())
                }
                autoFocus
              />
              <button
                className="btn btn-primary btn-full"
                onClick={() => advanceQ3(writeInValue.trim())}
                disabled={!canAdvanceQ3}
              >
                Next →
              </button>
            </>
          ) : (
            <button className="write-in-toggle" onClick={toggleWriteIn} type="button">
              <span>+</span> Something else? Write it in.
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Screen: Q4 — Biggest Challenge ────────────────────────────
  if (screen === "q4") {
    const canAdvanceQ4 = showWriteIn ? writeInValue.trim().length > 0 : challenge !== "";
    const advanceQ4 = (value: string) => {
      setChallenge(value);
      resetWriteIn();
      handleGenerate(value);
    };

    return (
      <div className="tool-container">
        <div className="screen">
          <p className="tool-tag">AGENT: Prompt Builder</p>
          <ProgressBar />
          <p className="step-label">Question 4 of 4</p>
          <p className="question-stem">
            What feels hardest about using AI right now?
          </p>
          <p className="question-subheadline">
            This is how we make your prompts actually solve something.
          </p>
          {error && (
            <p
              style={{
                color: "var(--cta)",
                fontSize: "0.875rem",
                marginBottom: "12px",
              }}
            >
              {error}
            </p>
          )}
          <div className="choices">
            {CHALLENGES.map((option) => (
              <button
                key={option}
                className={`choice ${challenge === option && !showWriteIn ? "selected" : ""}`}
                onClick={() => {
                  resetWriteIn();
                  setChallenge(option);
                  setTimeout(() => advanceQ4(option), 180);
                }}
              >
                <span className="choice-dot" />
                {option}
              </button>
            ))}
          </div>
          {showWriteIn ? (
            <>
              <input
                type="text"
                className="input"
                style={{ marginBottom: "12px" }}
                placeholder="Describe your biggest challenge with AI..."
                value={writeInValue}
                onChange={(e) => setWriteInValue(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && writeInValue.trim() && advanceQ4(writeInValue.trim())
                }
                autoFocus
              />
              <button
                className="btn btn-primary btn-full"
                onClick={() => advanceQ4(writeInValue.trim())}
                disabled={!canAdvanceQ4}
              >
                Build My Prompt Kit →
              </button>
            </>
          ) : (
            <button className="write-in-toggle" onClick={toggleWriteIn} type="button">
              <span>+</span> Something else? Write it in.
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Screen: Loading ────────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div className="tool-container">
        <div className="loading-screen">
          <div className="spinner" />
          <p className="loading-headline">Building your Prompt Kit...</p>
          <p className="loading-subline">
            Personalizing 12 prompts for {jobTitle || "your role"}
          </p>
        </div>
      </div>
    );
  }

  // ── Screen: Results ────────────────────────────────────────────
  if (screen === "results" && promptKit) {
    const totalPrompts = promptKit.categories.reduce(
      (sum, cat) => sum + cat.prompts.length,
      0
    );

    return (
      <div className="tool-container">
        <div className="screen">
          {/* Header */}
          <p className="results-tag">Your Prompt Kit is ready.</p>
          <h2 className="results-headline">
            {totalPrompts} AI prompts built for {jobTitle}.
          </h2>
          <p className="results-subheadline">
            Copy any prompt below and paste into ChatGPT or Claude. Fill in the
            brackets and go.
          </p>

          {/* Prompt categories */}
          {promptKit.categories.map((category, catIndex) => (
            <div key={catIndex} className="pb-category">
              <p className="pb-category-label">
                <span className="pb-category-num">
                  {String(catIndex + 1).padStart(2, "0")}
                </span>
                {category.name}
              </p>

              {category.prompts.map((prompt, promptIndex) => {
                const id = `${catIndex}-${promptIndex}`;
                return (
                  <div key={id} className="pb-prompt-card">
                    <p className="pb-prompt-title">{prompt.title}</p>
                    <div className="pb-prompt-text-wrapper">
                      <p className="pb-prompt-text">{prompt.prompt}</p>
                      <button
                        className={`pb-copy-btn ${
                          copiedId === id ? "copied" : ""
                        }`}
                        onClick={() => handleCopy(id, prompt.prompt)}
                      >
                        {copiedId === id ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="pb-prompt-why">{prompt.why}</p>
                  </div>
                );
              })}
            </div>
          ))}

          {/* ── Build Your AI System ─────────────────────────── */}
          <div className="pb-system-section">
            <p className="pb-system-eyebrow">Step 2</p>
            <h3 className="pb-system-headline">Build your AI System.</h3>
            <p className="pb-system-subline">
              Prompts are step one. A system is what makes AI work for you every
              single day — not just today.
            </p>

            {/* Step 01 — Set up your folder */}
            <div className="pb-system-step">
              <p className="pb-system-step-label">01 &nbsp;·&nbsp; Set up your AI folder</p>
              <p className="pb-system-step-body">
                Create a folder called <strong>My AI System</strong> — on your
                computer, in Notion, Google Docs, or wherever you already work.
                This is where everything lives. Once it exists, you stop
                starting from scratch.
              </p>
              <div className="pb-folder-tree">
                <p className="pb-folder-tree-item pb-folder-root">📁 My AI System/</p>
                <p className="pb-folder-tree-item pb-folder-indent">📄 My AI Profile</p>
                <p className="pb-folder-tree-item pb-folder-indent">📁 Prompt Library/</p>
                <p className="pb-folder-tree-item pb-folder-indent">📁 AI Wins/</p>
              </div>
              <p className="pb-system-tip">
                <strong>Using Claude Cowork?</strong> Your workspace folder
                already is this system — and Claude reads it automatically at
                the start of every session.
              </p>
            </div>

            {/* Step 02 — Save your prompts */}
            <div className="pb-system-step">
              <p className="pb-system-step-label">02 &nbsp;·&nbsp; Save your prompts somewhere you&apos;ll actually open</p>
              <p className="pb-system-step-body">
                Don&apos;t just rely on this page or the email. Pick one and
                save your Prompt Library folder there:
              </p>
              <ul className="pb-tool-list">
                {[
                  { name: "Google Docs", cost: "Free" },
                  { name: "Apple Notes", cost: "Free" },
                  { name: "Notion", cost: "Free" },
                  { name: "Microsoft Word", cost: "Free with Microsoft 365" },
                  { name: "Obsidian", cost: "$4/month — syncs across devices" },
                ].map((tool) => (
                  <li key={tool.name} className="pb-tool-item">
                    <span className="pb-tool-name">{tool.name}</span>
                    <span className="pb-tool-cost">{tool.cost}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step 03 — AI Profile */}
            <div className="pb-system-step">
              <p className="pb-system-step-label">03 &nbsp;·&nbsp; Your AI Profile</p>
              <p className="pb-system-step-body">
                This is a short paragraph AI reads before every conversation so
                it already knows who you are and how to help. Paste it into
                your AI tool&apos;s settings once — and every prompt you use
                gets better automatically.
              </p>
              <div className="pb-prompt-text-wrapper" style={{ marginBottom: "12px" }}>
                <p className="pb-prompt-text">{promptKit.aiProfile}</p>
                <button
                  className={`pb-copy-btn ${copiedId === "aiProfile" ? "copied" : ""}`}
                  onClick={() => handleCopy("aiProfile", promptKit.aiProfile)}
                >
                  {copiedId === "aiProfile" ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p className="pb-system-step-body" style={{ marginBottom: "10px" }}>
                <strong>Where to add it:</strong>
              </p>
              <ul className="pb-where-list">
                <li><strong>ChatGPT:</strong> Settings → Personalization → Custom Instructions</li>
                <li><strong>Claude:</strong> Settings → Profile → What should Claude know about you?</li>
                <li><strong>Gemini:</strong> Settings → Extensions &amp; Personalization</li>
                <li><strong>Any tool:</strong> Paste at the top of your first message in any new chat</li>
              </ul>
            </div>
          </div>

          {/* Email capture */}
          <div className="save-card" style={{ marginTop: "32px" }}>
            {!emailSubmitted ? (
              <>
                <p className="save-card-headline">Email me my Prompt Kit</p>
                <p className="save-card-subline">
                  Get a clean copy in your inbox so you always have it.
                </p>
                <div className="email-row">
                  <input
                    type="email"
                    className="input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !emailLoading && handleEmailSubmit()
                    }
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleEmailSubmit}
                    disabled={emailLoading || !email}
                  >
                    {emailLoading ? "Sending..." : "Send"}
                  </button>
                </div>
                <p className="trust-line">No spam. Just your results.</p>
              </>
            ) : (
              <div className="upload-success">
                <span>✓</span>
                Sent! Check your inbox for your Prompt Kit.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
