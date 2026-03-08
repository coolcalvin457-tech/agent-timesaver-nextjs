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

  // ── Helpers ────────────────────────────────────────────────────
  const progressIndex = QUESTION_SCREENS.indexOf(screen);

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
                className={`choice ${workType === option ? "selected" : ""}`}
                onClick={() => {
                  setWorkType(option);
                  setTimeout(() => setScreen("q3"), 180);
                }}
              >
                <span className="choice-dot" />
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Screen: Q3 — AI Usage ──────────────────────────────────────
  if (screen === "q3") {
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
                className={`choice ${aiUsage === option ? "selected" : ""}`}
                onClick={() => {
                  setAiUsage(option);
                  setTimeout(() => setScreen("q4"), 180);
                }}
              >
                <span className="choice-dot" />
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Screen: Q4 — Biggest Challenge ────────────────────────────
  if (screen === "q4") {
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
                className={`choice ${challenge === option ? "selected" : ""}`}
                onClick={() => {
                  setChallenge(option);
                  setTimeout(() => handleGenerate(option), 180);
                }}
              >
                <span className="choice-dot" />
                {option}
              </button>
            ))}
          </div>
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
