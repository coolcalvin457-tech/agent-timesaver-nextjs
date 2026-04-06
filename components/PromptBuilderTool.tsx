"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { track } from "@vercel/analytics";
import type { PromptKitResponse } from "@/app/api/prompt-kit/route";
import ToolEmailGate from "@/components/shared/ToolEmailGate";
import ToolLoadingScreen from "@/components/shared/ToolLoadingScreen";
import CrossSellBlock from "@/components/shared/CrossSellBlock";
import BackButton from "@/components/shared/BackButton";
import { useAuth } from "@/components/AuthProvider";

// ─── Constants ────────────────────────────────────────────────────────────────
const WORK_TYPES = [
  "Writing & Communication",
  "Analysis & Research",
  "Planning & Managing Projects",
  "Customer or Client-Facing Work",
  "Managing or Leading a Team",
];

const AI_USAGE_OPTIONS = [
  "No, I haven't started yet",
  "I've tried it, but results feel hit or miss",
  "Yes, I use it a few times a week",
  "Yes, I use it daily, but want better results",
];

const CHALLENGES = [
  "I don't know what to ask it",
  "The results feel too generic for my job",
  "Too much back-and-forth to get what I need",
  "I don't know how to give AI enough context",
];

// Shown when the user selected "No, I haven't started yet" on q3.
// Options and question heading are reframed to not assume past experience.
const NOT_STARTED_BARRIERS = [
  "I'm not sure what to use it for in my job",
  "I'm not sure how to get useful results",
  "It feels too technical or time-consuming to learn",
  "I haven't made time to try it yet",
];

const LOADING_STEPS = [
  "Job Role Analysis",
  "Prompt Library",
  "AI Profile",
  "AI Workspace Setup",
];

// ─── Em Dash Sanitizer ────────────────────────────────────────────────────────
// Defensive strip: the API prompt instructs Claude to avoid em dashes, but this
// client-side pass catches any that slip through and replaces them with a hyphen.
function stripEmDashes(s: string): string {
  return s.replace(/[—–]/g, " - ").replace(/ {2,}/g, " ").trim();
}

function sanitizePromptKit(data: PromptKitResponse): PromptKitResponse {
  return {
    ...data,
    aiProfile: stripEmDashes(data.aiProfile),
    categories: data.categories.map((cat) => ({
      ...cat,
      prompts: cat.prompts.map((p) => ({
        title: stripEmDashes(p.title),
        prompt: stripEmDashes(p.prompt),
        why: stripEmDashes(p.why),
      })),
    })),
  };
}

type Screen = "q1" | "q2" | "q3" | "q4" | "loading" | "email-gate" | "results";
const QUESTION_SCREENS: Screen[] = ["q1", "q2", "q3", "q4"];

const PREV_SCREEN: Partial<Record<Screen, Screen>> = {
  q2: "q1",
  q3: "q2",
  q4: "q3",
};

// ─── Component ────────────────────────────────────────────────────────────────
interface PromptBuilderToolProps {
  initialJobTitle?: string;
  onQ1Complete?: (jobTitle: string) => void;
  hideFileUpload?: boolean;
  showDeliverables?: boolean;
}

export default function PromptBuilderTool({ initialJobTitle, onQ1Complete, hideFileUpload, showDeliverables }: PromptBuilderToolProps) {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>("q1");
  const [jobTitle, setJobTitle] = useState(initialJobTitle?.trim() || "");
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
  const [loadingStep, setLoadingStep] = useState(0);
  const [expandedWhys, setExpandedWhys] = useState<Set<string>>(new Set());

  // File upload state
  const [jobDescFile, setJobDescFile] = useState<File | null>(null);
  const [jobDescText, setJobDescText] = useState("");

  const topRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const skipNextScroll = useRef(false);
  const authSkipFired = useRef(false);

  // ── Track tool start on mount ──────────────────────────────────
  useEffect(() => {
    track("tool_started");
  }, []);

  // ── Screen transition helpers ───────────────────────────────────
  const go = useCallback((s: Screen) => {
    setScreen(s);
    setFlipStage("in");
  }, []);

  // ── Auto-advance to Q2 if job title pre-filled from homepage embed ──
  useEffect(() => {
    if (initialJobTitle?.trim()) {
      skipNextScroll.current = true; // Don't scroll on auto-advance — let page load at top
      track("q1_completed", { jobTitle: initialJobTitle.trim() });
      go("q2");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (flipStage === "in") {
      const t = setTimeout(() => setFlipStage("idle"), 220);
      return () => clearTimeout(t);
    }
  }, [flipStage]);

  // ── Auth: skip email gate if logged in ─────────────────────────
  useEffect(() => {
    if (screen === "email-gate" && user && promptKit && !authSkipFired.current) {
      authSkipFired.current = true;
      setEmail(user.email);
      // Fire email in background, show results immediately
      fetch("/api/prompt-kit-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, jobTitle, promptKit }),
      }).catch(() => {});
      track("email_submitted", { jobTitle });
      go("results");
    }
  }, [screen, user, promptKit, jobTitle, go]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (skipNextScroll.current) {
      skipNextScroll.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [screen]);

  // ── Loading step advancement ─────────────────────────────────────
  useEffect(() => {
    if (screen !== "loading") return;
    setLoadingStep(0);
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 14000)
    );
    return () => timers.forEach(clearTimeout);
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

  const handleReset = () => {
    setJobTitle("");
    setWorkType("");
    setAiUsage("");
    setChallenge("");
    setPromptKit(null);
    setEmail("");
    setError("");
    setJobDescFile(null);
    setJobDescText("");
    resetWriteIn();
    go("q1");
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
      setPromptKit(sanitizePromptKit(data));
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
            autoFocus={!hideFileUpload}
          />

          {/* Optional file upload — hidden when embedded on homepage */}
          {!hideFileUpload && <div style={{ marginTop: "28px", display: "flex", width: "100%", boxSizing: "border-box", alignItems: "center" }}>
            <label
              className="choose-file-btn"
              style={{
                display: "flex",
                flex: 1,
                width: "100%",
                boxSizing: "border-box",
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
              {jobDescFile ? `✓ ${jobDescFile.name}` : "Upload job description (optional)"}
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
                  whiteSpace: "nowrap",
                }}
              >
                Remove
              </button>
            )}
          </div>}

          {/* Deliverables preview — shown when embedded on homepage */}
          {showDeliverables && (
            <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "14px" }}>
                What&apos;s included
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["12 Personalized Prompts", "AI Profile", "AI Workspace Setup"].map((item) => (
                  <div key={item} className="prompt-builder-kit-pill">
                    <span className="kit-item-check" style={{ fontSize: "0.75rem" }}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "24px" }}
            onClick={() => {
              track("q1_completed", { jobTitle });
              if (onQ1Complete) {
                onQ1Complete(jobTitle);
              } else {
                go("q2");
              }
            }}
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
            <>
              <button className="write-in-toggle" onClick={toggleWriteIn} type="button">
                <span>+</span> Something else? Write it in.
              </button>
              <button
                className="btn btn-primary btn-full"
                style={{ marginTop: "8px" }}
                onClick={() => advanceQ2(workType)}
                disabled={!workType}
              >
                Continue
              </button>
            </>
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
            Have you used ChatGPT, Claude, or Gemini?
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
            <>
              <button className="write-in-toggle" onClick={toggleWriteIn} type="button">
                <span>+</span> Something else? Write it in.
              </button>
              <button
                className="btn btn-primary btn-full"
                style={{ marginTop: "8px" }}
                onClick={() => advanceQ3(aiUsage)}
                disabled={!aiUsage}
              >
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Screen: Q4 — Biggest Challenge ────────────────────────────
  if (screen === "q4") {
    const notStarted = aiUsage === "No, I haven't started yet";
    const q4Heading = notStarted
      ? "What\u2019s made it hard to get started with AI?"
      : "What\u2019s been most challenging about using AI?";
    const q4Options = notStarted ? NOT_STARTED_BARRIERS : CHALLENGES;
    const q4Placeholder = notStarted
      ? "Describe what\u2019s been holding you back..."
      : "Describe your biggest challenge with AI...";

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
            {q4Heading}
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
            {q4Options.map((option) => (
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
                placeholder={q4Placeholder}
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
            <>
              <button className="write-in-toggle" onClick={toggleWriteIn} type="button">
                <span>+</span> Something else? Write it in.
              </button>
              <button
                className="btn btn-primary btn-full"
                style={{ marginTop: "8px" }}
                onClick={() => advanceQ4(challenge)}
                disabled={!challenge}
              >
                Build My Prompt Kit
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Screen: Loading ────────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <ToolLoadingScreen
          headingText="Building your prompt kit."
          timeEstimate="About 1 minute."
          steps={LOADING_STEPS}
          activeStep={loadingStep}
        />
      </div>
    );
  }

  // ── Screen: Email Gate ─────────────────────────────────────────
  if (screen === "email-gate" && promptKit) {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <ToolEmailGate
            headline="Your prompt kit is ready."
            subtitle={jobTitle || undefined}
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleEmailSubmit}
            loading={emailLoading}
            buttonLabel="Send My Kit"
            inputId="pb-email"
          />
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
          <p className="pb-system-eyebrow" style={{ marginBottom: "8px" }}>Step 1</p>
          <h2 className="results-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, marginBottom: "6px" }}>
            12 prompts built for {jobTitle}.
          </h2>
          <p className="screen-subheadline" style={{ marginBottom: "36px" }}>
            Copy and paste into your AI tool of choice.
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

          {/* ── Step 2: AI Profile ─────────── */}
          <div className="pb-system-section">
            <p className="pb-system-eyebrow">Step 2</p>
            <h3 className="pb-system-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>Your AI Profile.</h3>
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
              Tell AI to save its response as <strong>AI Profile.md</strong>
            </p>
          </div>

          {/* ── Step 3: AI Workspace Setup ─────────── */}
          <div className="pb-system-section">
            <p className="pb-system-eyebrow">Step 3</p>
            <h3 className="pb-system-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>Your AI Workspace Setup.</h3>
            <p className="pb-system-step-body">
              Set this up once. AI will know who you are every time.
            </p>
            <p className="pb-system-step-body" style={{ marginTop: "16px" }}>
              Paste this into your AI tool to get everything set up:
            </p>
            <div className="pb-prompt-text-wrapper" style={{ marginTop: "12px", flexDirection: "column", alignItems: "stretch" }}>
              <p className="pb-prompt-text">{`I just created my AI Profile and I want to set up my workspace properly. Help me with two things: (1) Tell me exactly where and how to save my AI Profile as custom instructions in this tool, so you always know who I am without me having to re-explain myself. (2) Walk me through setting up a folder on my desktop to save my AI work going forward. Here's my profile:\n\n${promptKit.aiProfile}`}</p>
              <button
                className={`pb-copy-btn ${copiedId === "starterPrompt" ? "copied" : ""}`}
                onClick={() => handleCopy("starterPrompt", `I just created my AI Profile and I want to set up my workspace properly. Help me with two things: (1) Tell me exactly where and how to save my AI Profile as custom instructions in this tool, so you always know who I am without me having to re-explain myself. (2) Walk me through setting up a folder on my desktop to save my AI work going forward. Here's my profile:\n\n${promptKit.aiProfile}`)}
                style={{ alignSelf: "flex-end", marginTop: "10px" }}
              >
                {copiedId === "starterPrompt" ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p className="pb-system-step-body" style={{ marginTop: "24px" }}>
              Then build your folder structure on your desktop:
            </p>
            <div className="pb-folder-tree">
              <p className="pb-folder-tree-item pb-folder-root">🗂️ [YourName]&apos;s AI Workspace</p>
              <p className="pb-folder-tree-item pb-folder-indent" style={{ color: "#fff" }}>📄 AI Profile.md</p>
              <p className="pb-folder-tree-item pb-folder-indent">🗂️ Prompt Library</p>
              <p className="pb-folder-tree-item pb-folder-indent">🗂️ Saved Results</p>
              <p className="pb-folder-tree-item pb-folder-indent">🗂️ Reference Files</p>
            </div>
            <p className="pb-system-step-body" style={{ marginTop: "16px" }}>
              AI Profile.md is what your AI will reference. Update as you go.
            </p>
            <p className="pb-system-step-body" style={{ marginTop: "12px" }}>
              When AI gives you something worth keeping, ask it to save as an .md file. AI will now remember your info between chats.
            </p>
          </div>

          {/* Cross-sell — AGENT: Workflow */}
          <CrossSellBlock
            productName="AGENT: Workflow"
            descriptionLines={[
              "Turn your prompts into repeatable AI workflows.",
              "Built for real jobs. Not demos.",
            ]}
            buttonLabel="Try Now"
            href="/workflow"
          />

        </div>
      </div>
    );
  }

  return null;
}
