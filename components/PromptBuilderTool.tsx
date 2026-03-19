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
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [expandedWhys, setExpandedWhys] = useState<Set<string>>(new Set());

  // File upload state
  const [jobDescFile, setJobDescFile] = useState<File | null>(null);
  const [jobDescText, setJobDescText] = useState("");

  const topRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

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
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [screen]);

  // ── Cycling loading messages ────────────────────────────────────
  useEffect(() => {
    if (screen !== "loading") {
      setLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % 5);
    }, 6000);
    return () => clearInterval(interval);
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

  const toggleWhy = (id: string) => {
    setExpandedWhys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
          <ProgressBar />
          <p className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25 }}>What&apos;s your job title?</p>
          <p className="screen-subheadline">
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
          <div style={{ marginTop: "36px" }}>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "12px",
              }}
            >
              Optional: upload a job description for more specific prompts.
            </p>
            <label
              className="choose-file-btn"
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
              {jobDescFile ? `✓ ${jobDescFile.name}` : "Choose file"}
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
            Continue
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
          <BackButton onClick={() => goBack("q2")} />
          <ProgressBar />
          <p className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25 }}>
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
                Continue
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
          <BackButton onClick={() => goBack("q3")} />
          <ProgressBar />
          <p className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25 }}>
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
                Continue
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
          <BackButton onClick={() => goBack("q4")} />
          <ProgressBar />
          <p className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25 }}>
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
                Build My Prompt Kit
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
    const loadingMessages = [
      `Personalizing prompts for ${jobTitle || "your role"}...`,
      "Grounding in your job role...",
      "Writing job-specific prompts...",
      "Running quality checks...",
      "Almost ready...",
    ];
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="loading-screen" style={{ minHeight: "320px" }}>
          <div className="spinner" />
          <p className="loading-headline">Building your Prompt Kit...</p>
          <p key={loadingMsgIndex} className="loading-subline">
            {loadingMessages[loadingMsgIndex]}
          </p>
          <p className="loading-subline" style={{ marginTop: "8px" }}>
            About a minute.
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
          <p className="results-tag" style={{ marginBottom: "6px" }}>Congrats! Your Prompt Kit is ready.</p>
          <h2 className="results-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, marginBottom: "10px" }}>
            12 prompts built for {jobTitle}.
          </h2>
          <p className="screen-subheadline" style={{ marginTop: 0, marginBottom: "24px" }}>
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
                {emailLoading ? "Loading..." : "See My Results"}
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
          <p className="results-tag" style={{ marginBottom: "8px" }}>Your Prompt Kit is ready.</p>
          <h2 className="results-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, marginBottom: "14px" }}>
            {totalPrompts} AI prompts built for {jobTitle}.
          </h2>
          <p className="screen-subheadline" style={{ marginBottom: "36px" }}>
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
                    <div className="pb-prompt-text-wrapper" style={{ flexDirection: "column", alignItems: "stretch" }}>
                      <p className="pb-prompt-text">{prompt.prompt}</p>
                      <button
                        className={`pb-copy-btn ${
                          copiedId === id ? "copied" : ""
                        }`}
                        onClick={() => handleCopy(id, prompt.prompt)}
                        style={{ alignSelf: "flex-end", marginTop: "10px" }}
                      >
                        {copiedId === id ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleWhy(id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.3)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        padding: "10px 0 0 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {expandedWhys.has(id) ? "▲ Hide explanation" : "▼ Why this works"}
                    </button>
                    {expandedWhys.has(id) && (
                      <p className="pb-prompt-why" style={{ marginTop: "8px" }}>{prompt.why}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* ── The setup that makes AI remember you ─────────── */}
          <div className="pb-system-section">
            <p className="pb-system-eyebrow">Step 2</p>
            <h3 className="pb-system-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>The setup that makes AI remember you.</h3>
            <p className="pb-system-subline">
              Prompts are step one. Here&apos;s what makes them work every time.
            </p>

            {/* Step 1 — AI Profile */}
            <div className="pb-system-step">
              <p className="pb-system-step-label">1 &nbsp;·&nbsp; Your AI Profile</p>
              <p className="pb-system-step-body">
                Paste this into AI once. No need to re-introduce yourself or start from scratch ever again.
              </p>
              <div className="pb-prompt-text-wrapper" style={{ marginBottom: "12px", flexDirection: "column", alignItems: "stretch" }}>
                <p className="pb-prompt-text">{promptKit.aiProfile}</p>
                <button
                  className={`pb-copy-btn ${copiedId === "aiProfile" ? "copied" : ""}`}
                  onClick={() => handleCopy("aiProfile", promptKit.aiProfile)}
                  style={{ alignSelf: "flex-end", marginTop: "10px" }}
                >
                  {copiedId === "aiProfile" ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p className="pb-system-step-body">
                <strong>Where to add it:</strong> Settings. Not sure where, just ask AI.
              </p>
            </div>

            {/* Step 2 — Folder structure */}
            <div className="pb-system-step">
              <p className="pb-system-step-label">2 &nbsp;·&nbsp; Set up your AI folder</p>
              <p className="pb-system-step-body">
                Create a folder structure on your desktop.
              </p>
              <div className="pb-folder-tree">
                <p className="pb-folder-tree-item pb-folder-root">📁 [YourName]&apos;s AI Workspace/</p>
                <p className="pb-folder-tree-item pb-folder-indent">📄 AI Profile.md</p>
                <p className="pb-folder-tree-item pb-folder-indent">📁 Prompt Library/</p>
                <p className="pb-folder-tree-item pb-folder-indent">📁 Saved Results/</p>
              </div>
              <p className="pb-system-step-body" style={{ marginTop: "16px" }}>
                Ask AI to format any information you&apos;re saving as a .md file.
              </p>
            </div>
          </div>

          {/* Cross-sell CTAs */}
          <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "row", justifyContent: "center", gap: "40px" }}>
            <a href="/" style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", textDecoration: "none", letterSpacing: "0.01em" }}>
              AGENT: Timesaver
            </a>
            <a href="/budget-spreadsheets" style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", textDecoration: "none", letterSpacing: "0.01em" }}>
              AGENT: Budget Spreadsheets
            </a>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
