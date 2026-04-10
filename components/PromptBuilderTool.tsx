"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { track } from "@vercel/analytics";
import type { PromptKitResponse } from "@/app/api/prompt-kit/route";
import ToolEmailGate from "@/components/shared/ToolEmailGate";
import ToolLoadingScreen from "@/components/shared/ToolLoadingScreen";
import CrossSellBlock from "@/components/shared/CrossSellBlock";
import StepIndicator from "@/components/shared/StepIndicator";
import BackButton from "@/components/shared/BackButton";
import MultiChoiceQuestionCard from "@/components/shared/MultiChoiceQuestionCard";
import { useAuth } from "@/components/AuthProvider";

// ─── Constants ────────────────────────────────────────────────────────────────
// F53 (S137): reduced to 3 options for MultiChoiceQuestionCard + peer write-in.
const WORK_TYPES = [
  "Writing & Communication",
  "Analysis & Research",
  "Planning & Managing Projects",
];

// F54 (S137): reduced to 3 options for MultiChoiceQuestionCard + peer write-in.
const AI_USAGE_OPTIONS = [
  "No, not yet",
  "Yes, but only to help draft emails or docs",
  "Yes, I'm familiar, but want better results",
];

// F55 (S137): single universal set of 3 options. NOT_STARTED_BARRIERS removed.
const CHALLENGES = [
  "I don't know what to use it for at my job",
  "I'm not sure how to effectively prompt",
  "I feel like I'm constantly re-explaining things",
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

const PREV_SCREEN: Partial<Record<Screen, Screen>> = {
  q2: "q1",
  q3: "q2",
  q4: "q3",
};

// ─── Component ────────────────────────────────────────────────────────────────
interface PromptBuilderToolProps {
  initialJobTitle?: string;
  onQ1Complete?: (jobTitle: string) => void;
  /**
   * Whether to autofocus the Q1 job-title input on mount.
   * Default `true` for standalone `/prompts` page.
   * Homepage embed (`PromptBuilderHomepageWrap`) passes `false` to prevent
   * the browser from scrolling the below-the-fold input into view on page load.
   */
  autoFocusJobTitle?: boolean;
}

export default function PromptBuilderTool({ initialJobTitle, onQ1Complete, autoFocusJobTitle = true }: PromptBuilderToolProps) {
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
  const [flipStage, setFlipStage] = useState<"idle" | "in">("idle");
  const [expandedWhys, setExpandedWhys] = useState<Set<string>>(new Set());

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

  const flipClass = flipStage === "in" ? "screen-flip-in" : "";

  // ── Helpers ────────────────────────────────────────────────────
  const goBack = (from: Screen) => {
    const prev = PREV_SCREEN[from];
    if (prev) {
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
    go("q1");
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

  // ── Screen: Q1 — Job Title ─────────────────────────────────────
  if (screen === "q1") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <StepIndicator total={4} current={1} />
          <p className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25 }}>What&apos;s your job title?</p>
          <p className="screen-subheadline">
            Be specific. &ldquo;Senior HR Business Partner&rdquo; is better than &ldquo;HR.&rdquo;
          </p>
          <input
            type="text"
            className="input"
            placeholder="e.g. Senior Marketing Manager, Account Executive"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && jobTitle.trim()) {
                track("q1_completed", { jobTitle });
                go("q2");
              }
            }}
            autoFocus={autoFocusJobTitle}
          />

          {/* Deliverables preview — universal on every Q1 surface */}
          <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "14px" }}>
              What&apos;s included
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {["AI Workspace Setup", "AI Profile", "12 Personalized Prompts"].map((item) => (
                <div key={item} className="prompt-builder-kit-pill">
                  <span className="kit-item-check" style={{ fontSize: "0.75rem" }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

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

  // ── Screen: Q2 — Work Type (F53: MultiChoiceQuestionCard, S137) ─
  if (screen === "q2") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <BackButton onClick={() => goBack("q2")} />
          <StepIndicator total={4} current={2} />
          <MultiChoiceQuestionCard
            stem="What best describes most of your work?"
            choices={WORK_TYPES}
            onAnswer={(value) => {
              setWorkType(value);
              track("q2_completed", { workType: value });
              go("q3");
            }}
          />
        </div>
      </div>
    );
  }

  // ── Screen: Q3 — AI Usage (F54: MultiChoiceQuestionCard, S137) ──
  if (screen === "q3") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <BackButton onClick={() => goBack("q3")} />
          <StepIndicator total={4} current={3} />
          <MultiChoiceQuestionCard
            stem="Have you used ChatGPT, Claude, or Gemini?"
            choices={AI_USAGE_OPTIONS}
            onAnswer={(value) => {
              setAiUsage(value);
              track("q3_completed", { aiUsage: value });
              go("q4");
            }}
          />
        </div>
      </div>
    );
  }

  // ── Screen: Q4 — Biggest Challenge (F55: MultiChoiceQuestionCard, S137) ──
  // NOT_STARTED_BARRIERS branch removed. Single universal question + options.
  if (screen === "q4") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <BackButton onClick={() => goBack("q4")} />
          <StepIndicator total={4} current={4} />
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
          <MultiChoiceQuestionCard
            stem="What's been most challenging about using AI?"
            choices={CHALLENGES}
            writeInCommitLabel="Build My Prompt Kit"
            onAnswer={(value) => {
              setChallenge(value);
              track("q4_completed", { challenge: value });
              handleGenerate(value);
            }}
          />
        </div>
      </div>
    );
  }

  // ── Screen: Loading ────────────────────────────────────────────
  // S126 F48: Thinking dots loader. F56 (S137): added time estimate.
  // Observed p50 ~25-45s, can approach 60s under load. No adaptive thinking
  // (free tool spec). Time estimate sets user expectations honestly.
  if (screen === "loading") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="loading-screen" style={{ minHeight: "320px" }}>
          <ToolLoadingScreen headingText="Thinking" timeEstimate="About 90 seconds" />
        </div>
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
            Your AI Workspace Setup.
          </h2>
          <p className="pb-system-step-body" style={{ marginBottom: "20px", fontSize: "0.8125rem" }}>
            Set this up once. AI will know who you are every time.
          </p>

          {/* ── Step 1: AI Workspace Setup (S137 redesign) ── */}
          <div className="pb-system-section">
            <div className="pb-workspace-card">
              <p className="pb-workspace-card-label">Folder structure</p>
              <div className="pb-workspace-tree">
                <p className="pb-tree-root">[YourName]&apos;s AI Workspace</p>
                <div className="pb-tree-children">
                  <p className="pb-tree-item pb-tree-file">AI Profile.md</p>
                  <p className="pb-tree-item pb-tree-folder">Prompt Library</p>
                  <p className="pb-tree-item pb-tree-folder">Saved Results</p>
                  <p className="pb-tree-item pb-tree-folder pb-tree-last">Reference Files</p>
                </div>
              </div>
            </div>
            <p className="pb-system-step-body" style={{ marginTop: "16px", fontSize: "0.8125rem" }}>
              Add this on your desktop so AI can reference it going forward.
            </p>
          </div>

          {/* ── Step 2: AI Profile ─────────── */}
          <div className="pb-system-section">
            <p className="pb-system-eyebrow">Step 2</p>
            <h3 className="pb-system-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>Your AI Profile.</h3>
            <p className="pb-system-step-body" style={{ fontSize: "0.8125rem" }}>
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
            <p className="pb-system-step-body" style={{ fontSize: "0.8125rem" }}>
              Tell AI to save its response as <strong>AI Profile.md</strong>
            </p>
          </div>

          {/* ── Step 3: 12 Personalized Prompts ─────────── */}
          <div className="pb-system-section">
            <p className="pb-system-eyebrow">Step 3</p>
            <h3 className="pb-system-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
              12 Prompts for {jobTitle}.
            </h3>
            <p className="pb-system-step-body" style={{ marginBottom: "24px", fontSize: "0.8125rem" }}>
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
          </div>

          {/* Cross-sell — AGENT: Workflow */}
          <CrossSellBlock
            productName="AGENT: Workflow"
            checklistItems={[
              "Workflow Playbook",
              "AI Setup",
              "Key Insights",
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
