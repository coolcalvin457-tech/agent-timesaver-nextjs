"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { track } from "@vercel/analytics";

import type { Question } from "@/app/api/questions/route";
import type { Workflow, ROI } from "@/app/api/workflows/route";
import ToolLoadingScreen from "@/components/shared/ToolLoadingScreen";
import ToolEmailGate from "@/components/shared/ToolEmailGate";
import BackButton from "@/components/shared/BackButton";
import CrossSellBlock from "@/components/shared/CrossSellBlock";
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
  selectedChoice: string | null;
  writeInValue: string;
  showWriteIn: boolean;
  answers: string[];
  workflows: Workflow[];
  roi: ROI | null;
}

// ─── Em Dash Sanitizer ────────────────────────────────────────────────────────
// Defensive strip: API prompts instruct Claude to avoid em dashes, but this
// catches any that slip through before they are rendered in the browser.
function stripEmDashes(s: string): string {
  return s.replace(/[—–]/g, " - ").replace(/ {2,}/g, " ").trim();
}

function sanitizeWorkflowData(workflows: Workflow[], roi: ROI): { workflows: Workflow[]; roi: ROI } {
  return {
    workflows: workflows.map((wf) => ({
      ...wf,
      title: stripEmDashes(wf.title),
      description: stripEmDashes(wf.description),
      tool: stripEmDashes(wf.tool),
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
    selectedChoice: null,
    writeInValue: "",
    showWriteIn: false,
    answers: [],
    workflows: [],
    roi: null,
  });

  const [jobTitleInput, setJobTitleInput] = useState("");
  const [emailGateInput, setEmailGateInput] = useState("");
  const [fileUploaded, setFileUploaded] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState<"questions" | "workflows">("questions");
  const [gateSending, setGateSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const authSkipFired = useRef(false);
  const isFirstRender = useRef(true);

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

  // ── Scroll to top on screen change (skip initial render) ────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          workflows: state.workflows,
          roi: state.roi,
        }),
      }).catch(() => {});
      track("email_submitted", { jobTitle: state.jobTitle });
      go("results");
    }
  }, [state.screen, user, state.jobTitle, state.workflows, state.roi, go]);

  // ── API Call 1: Generate questions ─────────────────────────────────────────
  const loadQuestions = useCallback(
    async (
      jobTitle: string,
      path: Path,
      jobDescription?: string
    ) => {
      setIsLoading(true);
      setError(null);
      setLoadingType("questions");
      go("loading");

      try {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle, path, jobDescription }),
        });

        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json() as { questions: Question[] };

        setState((s) => ({
          ...s,
          questions: data.questions,
          questionIndex: 0,
          selectedChoice: null,
          writeInValue: "",
          showWriteIn: false,
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

  // ── API Call 2: Generate workflows ────────────────────────────────────────
  const loadWorkflows = useCallback(
    async (jobTitle: string, answers: string[], path: Path, jobDescription?: string) => {
      setIsLoading(true);
      setError(null);
      setLoadingType("workflows");
      go("loading");

      try {
        const res = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle, answers, path, jobDescription }),
        });

        if (!res.ok) throw new Error("Failed to fetch workflows");
        const data = await res.json() as { workflows: Workflow[]; roi: ROI };
        const sanitized = sanitizeWorkflowData(data.workflows, data.roi);

        track("results_viewed", { jobTitle, path: path ?? "none" });
        setState((s) => ({
          ...s,
          workflows: sanitized.workflows,
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

  const handleChoiceSelect = (choice: string) => {
    setState((s) => ({
      ...s,
      selectedChoice: choice,
      showWriteIn: false,
      writeInValue: "",
    }));

    // Auto-advance after brief visual feedback (matches Prompt Builder)
    setTimeout(() => {
      const newAnswers = [...state.answers, choice];
      const nextIndex = state.questionIndex + 1;

      if (nextIndex >= state.questions.length) {
        track("questions_completed", { path: state.path ?? "none", jobTitle: state.jobTitle });
        loadWorkflows(state.jobTitle, newAnswers, state.path, state.jobDescription);
      } else {
        setState((s) => ({
          ...s,
          answers: newAnswers,
          questionIndex: nextIndex,
          selectedChoice: null,
          writeInValue: "",
          showWriteIn: false,
        }));
      }
    }, 180);
  };

  const toggleWriteIn = () => {
    setState((s) => ({
      ...s,
      showWriteIn: !s.showWriteIn,
      selectedChoice: null,
    }));
  };

  const handleNextQuestion = () => {
    const answer = state.showWriteIn
      ? state.writeInValue.trim()
      : state.selectedChoice;
    if (!answer) return;

    const newAnswers = [...state.answers, answer];
    const nextIndex = state.questionIndex + 1;

    if (nextIndex >= state.questions.length) {
      // All questions answered — load workflows
      track("questions_completed", { path: state.path ?? "none", jobTitle: state.jobTitle });
      loadWorkflows(state.jobTitle, newAnswers, state.path, state.jobDescription);
    } else {
      setState((s) => ({
        ...s,
        answers: newAnswers,
        questionIndex: nextIndex,
        selectedChoice: null,
        writeInValue: "",
        showWriteIn: false,
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
        workflows: state.workflows,
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
  const canContinueQuestion =
    state.showWriteIn
      ? state.writeInValue.trim().length > 0
      : state.selectedChoice !== null;

  const flipClass = flipStage === "in" ? "screen-flip-in" : "";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
      {/* ── Screen 00: Intro ─────────────────────────────────────────────── */}
      {state.screen === "intro" && (
        <div className="screen" style={{ display: "flex", flexDirection: "column", flex: "0 0 auto", textAlign: "center", justifyContent: "center", paddingTop: "72px", paddingBottom: "72px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
            <div className="tool-tag" style={{ textAlign: "center", marginBottom: "20px" }}>AGENT: Timesaver</div>
            <h1 className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25, marginBottom: "20px" }}>
              See how many hours<br />you could be saving.
            </h1>
            <p className="screen-subheadline" style={{ marginBottom: "28px" }}>
              <span style={{ display: "block" }}>Answer a few questions.</span>
              <span style={{ display: "block", marginTop: "6px" }}>Get 5 personalized AI workflows.</span>
            </p>
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

          <h1 className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25 }}>What&apos;s your job title?</h1>
          <p className="screen-subheadline">
            Be specific. &ldquo;Senior HR Business Partner&rdquo; beats &ldquo;HR.&rdquo;
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

          <input
            className="input"
            style={{ marginBottom: "36px" }}
            type="text"
            placeholder="e.g. Real Estate Agent, HR Director, 3rd Grade Teacher..."
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
              <div className="branch-card-desc">
                Upload a file or<br />copy &amp; paste.
              </div>
              <span className="branch-badge branch-badge-a">Best results</span>
            </button>

            <button
              className={`branch-card branch-card-path-b ${state.path === "B" ? "selected" : ""}`}
              onClick={() => handlePathSelect("B")}
              type="button"
            >
              <div className="branch-card-title">NO</div>
              <div className="branch-card-desc">
                I&apos;ll answer multiple<br />choice questions.
              </div>
              <span className="branch-badge branch-badge-b">Quick start</span>
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

          <h1 className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25, whiteSpace: "nowrap", marginBottom: "28px" }}>Upload or copy &amp; paste.</h1>

          {fileUploaded ? (
            <div className="upload-success">
              <span>✓</span>
              <span>{fileUploaded}</span>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `1.5px dashed ${isDragOver ? "var(--cta)" : "rgba(30,122,184,0.6)"}`,
                borderRadius: "var(--radius-input)",
                padding: "28px 20px",
                textAlign: "center",
                cursor: "pointer",
                marginBottom: "0",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", marginBottom: "12px" }}>
                Drag and drop, or
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                type="button"
                style={{ borderColor: "var(--cta)", color: "#fff", background: "transparent" }}
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
            placeholder="Or paste your job description here..."
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
      {state.screen === "loading" && (
        <div className="loading-screen" style={{ minHeight: "320px" }}>
          <div className="tool-tag" style={{ textAlign: "center" }}>AGENT: Timesaver</div>
          <ToolLoadingScreen
            headingText={loadingType === "questions" ? "Personalizing your questions." : "Building your workflows."}
            timeEstimate={loadingType === "questions" ? "About 5 seconds." : "About 15 seconds."}
            subLine={loadingType === "workflows" ? "Calculating hours saved..." : undefined}
          />
        </div>
      )}

      {/* ── Question Screens ──────────────────────────────────────────────── */}
      {state.screen === "question" && currentQuestion && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>

          <BackButton onClick={() => go("jobTitle")} />

          {/* Progress pips */}
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

          <p className="screen-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25 }}>{currentQuestion.stem}</p>

          <div className="choices">
            {currentQuestion.choices.map((choice, i) => (
              <button
                key={i}
                className={`choice ${state.selectedChoice === choice ? "selected" : ""}`}
                onClick={() => handleChoiceSelect(choice)}
                type="button"
              >
                <span className="choice-dot" />
                {choice}
              </button>
            ))}
          </div>

          {state.showWriteIn ? (
            <input
              className="input"
              style={{ marginBottom: "16px" }}
              type="text"
              placeholder="Type your answer..."
              autoFocus
              value={state.writeInValue}
              onChange={(e) =>
                setState((s) => ({ ...s, writeInValue: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && state.writeInValue.trim())
                  handleNextQuestion();
              }}
            />
          ) : (
            <button
              className="write-in-toggle"
              onClick={toggleWriteIn}
              type="button"
            >
              <span>+</span> Something else? Write it in.
            </button>
          )}

          {state.showWriteIn && (
            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: "8px" }}
              disabled={!canContinueQuestion}
              onClick={handleNextQuestion}
            >
              {isLastQuestion ? "Start Saving Time" : "Continue"}
            </button>
          )}
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
            fontSize: "0.875rem", color: "var(--text-secondary)",
          }}>
            <span style={{ color: "var(--cta)" }}>✓</span> Sent to your inbox.
          </div>

          <div className="results-tag" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", lineHeight: 1.25 }}>
            You could save {state.roi.totalHoursPerWeek} hours every week.
          </div>
          <p className="results-subheadline">
            Based on your answers and industry data.
          </p>

          {/* Workflow Cards */}
          <div className="workflow-cards">
            {state.workflows.map((wf, i) => {
              const cardId = `wf-${i}`;
              return (
                <div key={i} className="workflow-card" style={{ position: "relative" }}>
                  <button
                    className={`pb-copy-btn ${copiedId === cardId ? "copied" : ""}`}
                    onClick={() => handleCopy(cardId, wf.description)}
                    style={{ position: "absolute", top: "12px", right: "12px" }}
                  >
                    {copiedId === cardId ? "✓ Copied" : "Copy"}
                  </button>
                  <div className="workflow-label">Workflow 0{i + 1}</div>
                  <div className="workflow-title">{wf.title}</div>
                  <div className="workflow-desc">{wf.description}</div>
                  <div className="workflow-time">
                    ⏱ Saves ~{wf.timeSavedPerWeek}h/week · {wf.tool}
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
            <div className="roi-sub">Based on publicly available industry data</div>
          </div>

          <CrossSellBlock
            productName="AGENT: Prompt Builder"
            descriptionLines={[
              "12 Personalized Prompts · AI Profile · AI Workspace Setup",
              "Built for real jobs. Not demos.",
            ]}
            buttonLabel="Try It Free"
            href="/prompt-builder"
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
