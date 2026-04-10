"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { track } from "@vercel/analytics";

import type { Question } from "@/app/api/questions/route";
import type { TimeSaver, ROI } from "@/app/api/workflows/route";
import ToolLoadingScreen from "@/components/shared/ToolLoadingScreen";
import ToolEmailGate from "@/components/shared/ToolEmailGate";
import BackButton from "@/components/shared/BackButton";
import CrossSellBlock from "@/components/shared/CrossSellBlock";
import MultiChoiceQuestionCard from "@/components/shared/MultiChoiceQuestionCard";
import { useAuth } from "@/components/AuthProvider";

// ─── State Types ───────────────────────────────────────────────────────────────
type Screen =
  | "intro"
  | "jobTitle"
  | "jdUpload"
  | "question"
  | "loading"
  | "results"
  | "gate";

type Path = "A" | "B" | null;

interface AppState {
  screen: Screen;
  path: Path;
  jobTitle: string;
  jobDescription: string;
  questions: Question[];
  questionIndex: number;
  answers: string[];
  timeSavers: TimeSaver[];
  roi: ROI | null;
}

// ─── Em Dash Sanitizer ────────────────────────────────────────────────────────
// Defensive strip: API prompts instruct Claude to avoid em dashes, but this
// catches any that slip through before they are rendered in the browser.
function stripEmDashes(s: string): string {
  return s.replace(/[—–]/g, " - ").replace(/ {2,}/g, " ").trim();
}

function sanitizeTimeSaverData(timeSavers: TimeSaver[], roi: ROI): { timeSavers: TimeSaver[]; roi: ROI } {
  return {
    timeSavers: timeSavers.map((ts) => ({
      ...ts,
      title: stripEmDashes(ts.title),
      description: stripEmDashes(ts.description),
      tool: stripEmDashes(ts.tool),
    })),
    roi: {
      ...roi,
      valueAtSalary: stripEmDashes(roi.valueAtSalary),
      industry: stripEmDashes(roi.industry),
    },
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function TimesaverTool() {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>({
    screen: "intro",
    path: null,
    jobTitle: "",
    jobDescription: "",
    questions: [],
    questionIndex: 0,
    answers: [],
    timeSavers: [],
    roi: null,
  });

  const [jobTitleInput, setJobTitleInput] = useState("");
  const [emailGateInput, setEmailGateInput] = useState("");
  const [fileUploaded, setFileUploaded] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateSending, setGateSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const authSkipFired = useRef(false);
  const isFirstRender = useRef(true);
  const hasScrolledToTool = useRef(false);

  const [flipStage, setFlipStage] = useState<"idle" | "in">("idle");

  const go = useCallback((screen: Screen) => {
    setState((s) => ({ ...s, screen }));
    setFlipStage("in");
  }, []);

  useEffect(() => {
    if (flipStage === "in") {
      const t = setTimeout(() => setFlipStage("idle"), 220);
      return () => clearTimeout(t);
    }
  }, [flipStage]);

  // ── Scroll to tool on first entry only (free tool pattern: flip animation handles subsequent transitions) ────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!hasScrolledToTool.current) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      hasScrolledToTool.current = true;
    }
  }, [state.screen]);

  // ── Auth: skip email gate if logged in ─────────────────────────
  useEffect(() => {
    if (state.screen === "gate" && user && !authSkipFired.current) {
      authSkipFired.current = true;
      setEmailGateInput(user.email);
      // Fire email in background, show results immediately
      fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          jobTitle: state.jobTitle,
          timeSavers: state.timeSavers,
          roi: state.roi,
        }),
      }).catch(() => {});
      track("email_submitted", { jobTitle: state.jobTitle });
      go("results");
    }
  }, [state.screen, user, state.jobTitle, state.timeSavers, state.roi, go]);

  // ── API Call 1: Generate questions ─────────────────────────────────────────
  const loadQuestions = useCallback(
    async (
      jobTitle: string,
      path: Path,
      jobDescription?: string
    ) => {
      setIsLoading(true);
      setError(null);
      go("loading");

      try {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle, path, jobDescription }),
        });

        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json() as { questions: Question[] };

        // Defensive em dash strip on all Claude-generated question text
        const sanitizedQuestions = data.questions.map((q) => ({
          ...q,
          stem: stripEmDashes(q.stem),
          choices: q.choices.map((c) => stripEmDashes(c)),
        }));

        setState((s) => ({
          ...s,
          questions: sanitizedQuestions,
          questionIndex: 0,
          answers: [],
          screen: "question",
        }));
      } catch {
        setError("Something went wrong. Please try again.");
        go("jobTitle");
      } finally {
        setIsLoading(false);
      }
    },
    [go]
  );

  // ── API Call 2: Generate time-savers ──────────────────────────────────────
  // Route path stays "/api/workflows" as an intentional non-migration (S115-F46).
  const loadTimeSavers = useCallback(
    async (jobTitle: string, answers: string[], path: Path, jobDescription?: string) => {
      setIsLoading(true);
      setError(null);
      go("loading");

      try {
        const res = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle, answers, path, jobDescription }),
        });

        if (!res.ok) throw new Error("Failed to fetch time-savers");
        const data = await res.json() as { timeSavers: TimeSaver[]; roi: ROI };
        const sanitized = sanitizeTimeSaverData(data.timeSavers, data.roi);

        track("results_viewed", { jobTitle, path: path ?? "none" });
        setState((s) => ({
          ...s,
          timeSavers: sanitized.timeSavers,
          roi: sanitized.roi,
          screen: "gate",
        }));
      } catch {
        setError("Something went wrong generating your results. Please try again.");
        go("question");
      } finally {
        setIsLoading(false);
      }
    },
    [go]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePathSelect = (path: Path) => {
    setState((s) => ({ ...s, path }));
    track("path_selected", { path: path ?? "none" });
    // Auto-advance after 180ms (Layer 1 1.4 S80 pattern). Continue button stays as fallback.
    const trimmed = jobTitleInput.trim();
    if (trimmed.length > 1) {
      setTimeout(() => {
        setState((s) => ({ ...s, jobTitle: trimmed }));
        if (path === "A") {
          go("jdUpload");
        } else if (path === "B") {
          loadQuestions(trimmed, "B");
        }
      }, 180);
    }
  };

  const handleJobTitleContinue = () => {
    if (!jobTitleInput.trim()) return;
    setState((s) => ({ ...s, jobTitle: jobTitleInput.trim() }));

    if (state.path === "A") {
      go("jdUpload");
    } else if (state.path === "B") {
      loadQuestions(jobTitleInput.trim(), "B");
    }
  };

  const handleFileRead = (text: string) => {
    setState((s) => ({ ...s, jobDescription: text }));
    setFileUploaded("File loaded");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleFileRead(ev.target?.result as string);
    reader.readAsText(file);
    setFileUploaded(file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleFileRead(ev.target?.result as string);
    reader.readAsText(file);
    setFileUploaded(file.name);
  };

  const handleJDContinue = () => {
    const jd =
      state.jobDescription ||
      (textareaRef.current?.value ?? "");
    loadQuestions(state.jobTitle, "A", jd);
  };

  // S120-F34: Single answer handler — the MultiChoiceQuestionCard component
  // owns tile-selection + write-in state internally and calls this with the
  // committed answer string (either the chosen tile label or the trimmed
  // write-in value).
  const handleAnswer = (answer: string) => {
    const newAnswers = [...state.answers, answer];
    const nextIndex = state.questionIndex + 1;

    if (nextIndex >= state.questions.length) {
      track("questions_completed", { path: state.path ?? "none", jobTitle: state.jobTitle });
      loadTimeSavers(state.jobTitle, newAnswers, state.path, state.jobDescription);
    } else {
      setState((s) => ({
        ...s,
        answers: newAnswers,
        questionIndex: nextIndex,
      }));
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEmailSubmit = async () => {
    if (!emailGateInput.trim() || gateSending) return;
    setGateSending(true);

    fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailGateInput.trim(),
        jobTitle: state.jobTitle,
        timeSavers: state.timeSavers,
        roi: state.roi,
      }),
    }).catch(() => {});

    track("email_submitted", { jobTitle: state.jobTitle });
    go("results");
    setGateSending(false);
  };

  const totalQuestions = state.questions.length;
  const currentQuestion = state.questions[state.questionIndex];
  const isLastQuestion = state.questionIndex === totalQuestions - 1;

  const canContinueJobTitle =
    jobTitleInput.trim().length > 1 && state.path !== null;

  const flipClass = flipStage === "in" ? "screen-flip-in" : "";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
      {/* ── Screen 00: Intro ─────────────────────────────────────────────── */}
      {state.screen === "intro" && (
        <div className="screen" style={{ display: "flex", flexDirection: "column", flex: "0 0 auto", textAlign: "center", justifyContent: "center", paddingTop: "72px", paddingBottom: "72px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
            <div className="tool-tag" style={{ textAlign: "center", marginBottom: "14px" }}>AGENT: Timesaver</div>
            <h1 className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25, marginBottom: "36px" }}>
              See how many hours<br />you could save.
            </h1>
            <button
              id="timesaver-start-btn"
              className="btn btn-primary"
              style={{ padding: "10px 28px", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.04em" }}
              onClick={() => { track("tool_started"); go("jobTitle"); }}
            >
              Show Me
            </button>
          </div>
        </div>
      )}

      {/* ── Screen 01: Job Title + Branch ─────────────────────────────────── */}
      {state.screen === "jobTitle" && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>

          <h1 className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25, marginBottom: "28px" }}>What&apos;s your job title?</h1>

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

          <input
            className="input"
            style={{ marginBottom: "28px" }}
            type="text"
            placeholder="e.g. Operations Manager, Finance Director"
            value={jobTitleInput}
            onChange={(e) => setJobTitleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canContinueJobTitle)
                handleJobTitleContinue();
            }}
            autoFocus
          />

          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--text-secondary)",
              marginBottom: "20px",
            }}
          >
            Do you have a copy of your job description?
          </p>

          <div className="branch-cards">
            <button
              className={`branch-card branch-card-path-a ${state.path === "A" ? "selected" : ""}`}
              onClick={() => handlePathSelect("A")}
              type="button"
            >
              <div className="branch-card-title">YES</div>
            </button>

            <button
              className={`branch-card branch-card-path-b ${state.path === "B" ? "selected" : ""}`}
              onClick={() => handlePathSelect("B")}
              type="button"
            >
              <div className="branch-card-title">NO</div>
            </button>
          </div>

          {jobTitleInput.trim().length > 1 && state.path === null && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "10px", marginBottom: "0" }}>
              Select one to continue.
            </p>
          )}

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "28px" }}
            disabled={!canContinueJobTitle}
            onClick={handleJobTitleContinue}
          >
            Continue
          </button>
        </div>
      )}

      {/* ── Screen 01A: JD Upload/Paste (Path A) ──────────────────────────── */}
      {state.screen === "jdUpload" && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>
          <BackButton onClick={() => go("jobTitle")} />

          <h1 className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25, marginBottom: "28px" }}>Add job description.</h1>

          {fileUploaded ? (
            <div className="upload-success">
              <span>✓</span>
              <span>{fileUploaded}</span>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "8px 0",
              }}
            >
              <button
                className="btn btn-primary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="textarea"
            placeholder="Paste job description here."
            style={{ marginTop: "28px", marginBottom: "24px" }}
            defaultValue={state.jobDescription}
          />

          <button
            className="btn btn-primary btn-full"
            onClick={handleJDContinue}
          >
            Continue
          </button>
        </div>
      )}

      {/* ── Loading Screen ─────────────────────────────────────────────────── */}
      {/* Both stages use the calm "Thinking" screen (S116-F48). Observed p50
          generation time on Timesaver is well under 60s on both stages, so the
          animated checklist would never advance through its steps in a real
          run. Per master spec Layer 1 §1.3, sub-60s tools use the Thinking dots
          loader. Stage 1 already used Thinking (S112); Stage 2 now matches. */}
      {state.screen === "loading" && (
        <div className="loading-screen" style={{ minHeight: "320px" }}>
          <ToolLoadingScreen headingText="Thinking" />
        </div>
      )}

      {/* ── Question Screens ──────────────────────────────────────────────── */}
      {/* S120-F34: Peer Write-in Rule. Tile grid + write-in are owned by the
          shared MultiChoiceQuestionCard component. The write-in tile is the
          co-equal 4th tile and swaps in place into a textarea — no layout
          shift, no footer link. */}
      {state.screen === "question" && currentQuestion && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>

          <BackButton onClick={() => go("jobTitle")} />

          {/* Progress pips (S111-F17 — StepIndicator present on free tools) */}
          <div className="progress-bar" style={{ marginBottom: "24px" }}>
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={`progress-pip ${
                  i < state.questionIndex
                    ? "done"
                    : i === state.questionIndex
                    ? "active"
                    : ""
                }`}
              />
            ))}
          </div>

          <MultiChoiceQuestionCard
            key={`q-${state.questionIndex}`}
            stem={currentQuestion.stem}
            choices={currentQuestion.choices}
            onAnswer={handleAnswer}
            writeInCommitLabel={isLastQuestion ? "Start Saving Time" : "Continue"}
          />
        </div>
      )}

      {/* ── Screen 06: Results ────────────────────────────────────────────── */}
      {state.screen === "results" && state.roi && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>

          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(30,122,184,0.06)", border: "1px solid rgba(30,122,184,0.15)",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "20px",
            fontSize: "0.875rem", color: "#FFFFFF",
          }}>
            <span style={{ color: "#FFFFFF" }}>✓</span> Sent to your inbox.
          </div>

          <div className="results-tag" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25, color: "#FFFFFF", marginBottom: "8px" }}>
            You could save {state.roi.totalHoursPerWeek} hours every week.
          </div>
          {state.jobTitle && (
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.55)", margin: "0 0 28px", textAlign: "center" }}>
              {state.jobTitle}
            </p>
          )}

          {/* Time-saver Cards (S115-F46: plain "01" label, no prefix; F41: three-part structure) */}
          <div className="time-saver-cards">
            {state.timeSavers.map((ts, i) => {
              const cardId = `ts-${i}`;
              // F41: Prefer three-part fields; fall back to description for backwards compat
              const hasThreePart = ts.trigger && ts.prompt && ts.outcome;
              const copyText = hasThreePart
                ? `${ts.trigger} ${ts.prompt} ${ts.outcome}`
                : ts.description;
              return (
                <div key={i} className="time-saver-card" style={{ position: "relative" }}>
                  <button
                    className={`pb-copy-btn ${copiedId === cardId ? "copied" : ""}`}
                    onClick={() => handleCopy(cardId, copyText)}
                    style={{ position: "absolute", top: "12px", right: "12px" }}
                  >
                    {copiedId === cardId ? "✓ Copied" : "Copy"}
                  </button>
                  <div className="time-saver-label">0{i + 1}</div>
                  <div className="time-saver-title">{ts.title}</div>
                  {hasThreePart ? (
                    <div className="time-saver-desc">
                      <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.75)", fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>When</p>
                      <p style={{ margin: "0 0 12px" }}>{ts.trigger}</p>
                      <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.75)", fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Prompt</p>
                      <p style={{ margin: "0 0 12px" }}>{ts.prompt}</p>
                      <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.75)", fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Result</p>
                      <p style={{ margin: 0 }}>{ts.outcome}</p>
                    </div>
                  ) : (
                    <div className="time-saver-desc">{ts.description}</div>
                  )}
                  <div className="time-saver-time">
                    Saves ~{ts.timeSavedPerWeek}h/week
                  </div>
                </div>
              );
            })}
          </div>

          {/* ROI Dark Card */}
          <div className="roi-card">
            <div className="roi-label">Estimated weekly time savings</div>
            <div className="roi-value">{state.roi.totalHoursPerWeek} hours / week</div>
            <div className="roi-sub">{state.roi.annualHours} hours per year</div>
            <div className="roi-divider" />
            <div className="roi-label">Value at average {state.roi.industry} salary</div>
            <div className="roi-value">{state.roi.valueAtSalary} / year</div>
            <div className="roi-sub">Source: BLS {state.roi.salarySourceRole || state.roi.industry} median, {state.roi.salarySourceYear || 2024}</div>
          </div>

          <CrossSellBlock
            productName="AGENT: Prompts"
            checklistItems={[
              "AI Workspace Setup",
              "AI Profile",
              "12 Personalized Prompts",
            ]}
            buttonLabel="Try Now"
            href="/prompts"
          />
        </div>
      )}

      {/* ── Screen 07: Gate ───────────────────────────────────────────────── */}
      {state.screen === "gate" && (
        <div className="screen">
          <ToolEmailGate
            headline="Your results are ready."
            subtitle={state.jobTitle || undefined}
            email={emailGateInput}
            onEmailChange={setEmailGateInput}
            onSubmit={handleEmailSubmit}
            loading={gateSending}
            buttonLabel="See My Results"
            inputId="ts-email"
          />
        </div>
      )}

    </div>
  );
}
