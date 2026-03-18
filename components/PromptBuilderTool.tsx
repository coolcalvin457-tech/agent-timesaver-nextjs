"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { track } from "@vercel/analytics";
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

type Screen = "q1" | "q2" | "q3" | "q4" | "loading" | "email-gate" | "results";
const QUESTION_SCREENS: Screen[] = ["q1", "q2", "q3", "q4"];

const PREV_SCREEN: Partial<Record<Screen, Screen>> = {
  q2: "q1",
  q3: "q2",
  q4: "q3",
};

// ─── Back Button ───────────────────────────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: "var(--text-muted, #888886)",
        fontSize: "0.8125rem",
        cursor: "pointer",
        padding: "0",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        opacity: 0.7,
      }}
    >
      ← Back
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PromptBuilderTool() {
  const [screen, setScreen] = useState<Screen>("q1");
  const [jobTitle, setJobTitle] = useState("");
  const [workType, setWorkType] = useState("");
  const [aiUsage, setAiUsage] = useState("");
  const [challenge, setChallenge] = useState("");
  const [promptKit, setPromptKit] = useState<PromptKitResponse | null>(null);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showWriteIn, setShowWriteIn] = useState(false);
  const [writeInValue, setWriteInValue] = useState("");
  const [flipStage, setFlipStage] = useState<"idle" | "in">("idle");

  // File upload state
  const [jobDescFile, setJobDescFile] = useState<File | null>(null);
  const [jobDescText, setJobDescText] = useState("");

  const topRef = useRef<HTMLDivElement>(null);

  // ── Track tool start on mount ──────────────────────────────────
  useEffect(() => {
    track("tool_started");
  }, []);

  // ── Screen transition helpers ───────────────────────────────────
  const go = useCallback((s: Screen) => {
    setScreen(s);
    setFlipStage("in");
  }, []);

  useEffect(() => {
    if (flipStage === "in") {
      const t = setTimeout(() => setFlipStage("idle"), 220);
      return () => clearTimeout(t);
    }
  }, [flipStage]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [screen]);

  const flipClass = flipStage === "in" ? "screen-flip-in" : "";

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

  const goBack = (from: Screen) => {
    const prev = PREV_SCREEN[from];
    if (prev) {
      resetWriteIn();
      go(prev);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJobDescFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJobDescText((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
  };

  const handleGenerate = async (finalChallenge: string) => {
    go("loading");
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
          jobDescription: jobDescText || undefined,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data: PromptKitResponse = await res.json();
      setPromptKit(data);
      track("results_viewed", { jobTitle });
      go("email-gate");
    } catch {
      setError("Something went wrong. Please try again.");
      go("q4");
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !promptKit) return;
    setEmailLoading(true);

    // Fire email in background — don't block showing results
    fetch("/api/prompt-kit-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, jobTitle, promptKit }),
    }).catch(() => {}); // Fail silently

    track("email_submitted", { jobTitle });

    // Show results immediately
    go("results");
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

  // ── Screen: Q1 — Job Title ─────────────────────────────────────
  if (screen === "q1") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <div className="tool-tag">AGENT: Prompt Builder</div>
          <ProgressBar />
          <p className="step-label">Question 1 of 4</p>
          <p className="question-stem">What&apos;s your job title?</p>
          <p className="question-subheadline">
            Be specific. &ldquo;Senior HR Business Partner&rdquo; is better than &ldquo;HR.&rdquo;
          </p>
          <input
            type="text"
            className="input"
            placeholder="e.g. Marketing Manager, Account Executive, Nurse Practitioner..."
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && jobTitle.trim()) {
                track("q1_completed", { jobTitle });
                go("q2");
              }
            }}
            autoFocus
          />

          {/* Optional file upload */}
          <div style={{ marginTop: "20px" }}>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "8px",
              }}
            >
              Optional: upload a job description for more specific prompts
            </p>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: jobDescFile ? "var(--cta, #1E7AB8)" : "rgba(255,255,255,0.55)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 14px",
              }}
            >
              <input
                type="file"
                accept=".txt,.md"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              {jobDescFile ? `✓ ${jobDescFile.name}` : "Choose file (.txt)"}
            </label>
            {jobDescFile && (
              <button
                type="button"
                onClick={() => { setJobDescFile(null); setJobDescText(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
              >
                Remove
              </button>
            )}
          </div>

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "20px" }}
            onClick={() => { track("q1_completed", { jobTitle }); go("q2"); }}
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
      track("q2_completed", { workType: value });
      go("q3");
    };

    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <div className="tool-tag">AGENT: Prompt Builder</div>
          <BackButton onClick={() => goBack("q2")} />
          <ProgressBar />
          <p className="step-label">Question 2 of 4</p>
          <p className="question-stem">
            What best describes most of your work?
          </p>
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
              <textarea
                className="input"
                rows={4}
                style={{ marginBottom: "12px", resize: "vertical" }}
                placeholder="Describe your work in a few words..."
                value={writeInValue}
                onChange={(e) => setWriteInValue(e.target.value)}
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
      track("q3_completed", { aiUsage: value });
      go("q4");
    };

    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <div className="tool-tag">AGENT: Prompt Builder</div>
          <BackButton onClick={() => goBack("q3")} />
          <ProgressBar />
          <p className="step-label">Question 3 of 4</p>
          <p className="question-stem">
            How do you currently use AI tools like ChatGPT, Claude, or Gemini?
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
              <textarea
                className="input"
                rows={4}
                style={{ marginBottom: "12px", resize: "vertical" }}
                placeholder="Describe your current AI usage..."
                value={writeInValue}
                onChange={(e) => setWriteInValue(e.target.value)}
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
      track("q4_completed", { challenge: value });
      handleGenerate(value);
    };

    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <div className="tool-tag">AGENT: Prompt Builder</div>
          <BackButton onClick={() => goBack("q4")} />
          <ProgressBar />
          <p className="step-label">Almost there. Question 4 of 4</p>
          <p className="question-stem">
            Is there anything you&apos;ve found challenging about using AI?
          </p>
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(220,50,50,0.07)",
                border: "1px solid rgba(220,50,50,0.15)",
                borderRadius: "var(--radius-input)",
                fontSize: "0.875rem",
                color: "#c0392b",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
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
              <textarea
                className="input"
                rows={4}
                style={{ marginBottom: "12px", resize: "vertical" }}
                placeholder="Describe your biggest challenge with AI..."
                value={writeInValue}
                onChange={(e) => setWriteInValue(e.target.value)}
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
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="loading-screen" style={{ minHeight: "320px" }}>
          <div className="tool-tag" style={{ textAlign: "center" }}>AGENT: Prompt Builder</div>
          <div className="spinner" />
          <p className="loading-headline">Building your Prompt Kit...</p>
          <p className="loading-subline">
            Personalizing 12 prompts for {jobTitle || "your role"}
          </p>
          <p className="loading-subline" style={{ marginTop: "8px" }}>
            About 20 seconds.
          </p>
        </div>
      </div>
    );
  }

  // ── Screen: Email Gate ─────────────────────────────────────────
  if (screen === "email-gate" && promptKit) {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <div className="tool-tag">AGENT: Prompt Builder</div>
          <p className="results-tag">Congrats! Your Prompt Kit is ready.</p>
          <h2 className="results-headline">
            12 prompts built for {jobTitle}.
          </h2>
          <p className="screen-subheadline" style={{ marginBottom: "28px" }}>
            Enter your email to view your results. We&apos;ll send a copy to your inbox.
          </p>

          <div className="save-card">
            <div className="email-row">
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !emailLoading && email.trim() && handleEmailSubmit()
                }
                autoFocus
              />
              <button
                className="btn btn-primary"
                onClick={handleEmailSubmit}
                disabled={emailLoading || !email.trim()}
              >
                {emailLoading ? "Loading..." : "See My Results →"}
              </button>
            </div>
          </div>
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
      <div className={`tool-container pb-results-dark${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">

          {/* Sent confirmation */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(30,122,184,0.06)", border: "1px solid rgba(30,122,184,0.15)",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "20px",
            fontSize: "0.875rem", color: "rgba(255,255,255,0.6)",
          }}>
            <span style={{ color: "var(--cta)" }}>✓</span> Sent to your inbox.
          </div>

          {/* Header */}
          <div className="tool-tag">AGENT: Prompt Builder</div>
          <p className="results-tag">Your Prompt Kit is ready.</p>
          <h2 className="results-headline">
            {totalPrompts} AI prompts built for {jobTitle}.
          </h2>
          <p className="screen-subheadline">
            Copy any prompt below and paste into ChatGPT or Claude.
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
              single day. Not just today.
            </p>

            {/* Step 01 — Set up your folder */}
            <div className="pb-system-step">
              <p className="pb-system-step-label">01 &nbsp;·&nbsp; Set up your AI folder</p>
              <p className="pb-system-step-body">
                Create a folder called <strong>My AI System</strong> on your
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
                already is this system. Claude reads it automatically at
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
                  { name: "Obsidian", cost: "$4/month. Syncs across devices." },
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
                your AI tool&apos;s settings once. Every prompt you use
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

          {/* Cross-sell CTAs */}
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <a href="/" className="btn btn-primary btn-full">
              Try AGENT: Timesaver
            </a>
            <a href="/budget-spreadsheets" className="btn btn-outline btn-full">
              Try Budget Spreadsheets
            </a>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
