"use client";

import { useState, useRef, useCallback } from "react";
import { track } from "@vercel/analytics";

// ── Update these URLs when your community and guides are live ──────────────
const COMMUNITY_URL = "https://www.skool.com"; // TODO: replace with your Skool community link
const GUIDES_URL = "/guides";
// ──────────────────────────────────────────────────────────────────────────
import type { Question } from "@/app/api/questions/route";
import type { Workflow, ROI } from "@/app/api/workflows/route";

// ─── State Types ───────────────────────────────────────────────────────────────
type Screen =
  | "intro"
  | "jobTitle"
  | "jdUpload"
  | "question"
  | "loading"
  | "results"
  | "gate"
  | "confirm";

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
  emailSaved: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function TimesaverTool() {
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
    emailSaved: false,
  });

  const [jobTitleInput, setJobTitleInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailGateInput, setEmailGateInput] = useState("");
  const [fileUploaded, setFileUploaded] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const go = useCallback((screen: Screen) => {
    setState((s) => ({ ...s, screen }));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
      go("loading");

      try {
        const res = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle, answers, path, jobDescription }),
        });

        if (!res.ok) throw new Error("Failed to fetch workflows");
        const data = await res.json() as { workflows: Workflow[]; roi: ROI };

        track("results_viewed", { jobTitle, path: path ?? "none" });
        setState((s) => ({
          ...s,
          workflows: data.workflows,
          roi: data.roi,
          screen: "results",
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

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setEmailSending(true);
    setEmailError(null);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          jobTitle: state.jobTitle,
          workflows: state.workflows,
          roi: state.roi,
        }),
      });

      if (!res.ok) throw new Error("Failed to send email");

      track("email_submitted", { jobTitle: state.jobTitle });
      setState((s) => ({ ...s, emailSaved: true }));
      go("confirm");
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleGateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailGateInput.trim()) return;

    // Best-effort: add to list, don't block on failure
    try {
      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailGateInput.trim(),
          jobTitle: state.jobTitle,
          workflows: state.workflows,
          roi: state.roi,
        }),
      });
    } catch {
      // Silently continue — gate submission shouldn't block the user
    }

    go("confirm");
  };

  const handleSkipGate = () => {
    go("confirm");
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="tool-container" ref={topRef}>
      {/* ── Screen 00: Intro ─────────────────────────────────────────────── */}
      {state.screen === "intro" && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>

          <h1 className="screen-headline">
            Learn exactly how to leverage AI in your specific job.
          </h1>
          <p className="screen-subheadline">
            Answer a few questions. Get 5 personalized AI workflows built for
            your role. See how many hours you could save every week.
          </p>

          <div className="primer-box">
            <div className="primer-label">⚡ AI Lesson #1</div>
            <p className="primer-body">
              You get out what you put in. The more context you provide, the
              more powerful it becomes. Answer honestly. Then watch what happens.
            </p>
          </div>

          <button
            id="timesaver-start-btn"
            className="btn btn-primary btn-full"
            onClick={() => { track("tool_started"); go("jobTitle"); }}
          >
            Get Started →
          </button>
        </div>
      )}

      {/* ── Screen 01: Job Title + Branch ─────────────────────────────────── */}
      {state.screen === "jobTitle" && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>
          <div className="step-label">Step 1 of 2</div>

          <h1 className="screen-headline">What&apos;s your job title?</h1>
          <p className="screen-subheadline">
            Be specific. &ldquo;Content Marketing Manager&rdquo; beats
            &ldquo;Manager&rdquo; every time.
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
            style={{ marginBottom: "28px" }}
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

          <div
            className="branch-label"
            style={{ marginBottom: "12px", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}
          >
            One more thing before we continue.
          </div>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--text-secondary)",
              marginBottom: "12px",
            }}
          >
            Do you have your job description handy?
          </p>

          <div className="branch-cards">
            <button
              className={`branch-card branch-card-path-a ${state.path === "A" ? "selected" : ""}`}
              onClick={() => handlePathSelect("A")}
              type="button"
            >
              <div className="branch-card-title">Yes, I have my job description</div>
              <div className="branch-card-desc">
                Upload or paste it. Your results will be significantly more
                personalized.
              </div>
              <span className="branch-badge branch-badge-a">Best results</span>
            </button>

            <button
              className={`branch-card branch-card-path-b ${state.path === "B" ? "selected" : ""}`}
              onClick={() => handlePathSelect("B")}
              type="button"
            >
              <div className="branch-card-title">No, just use my title</div>
              <div className="branch-card-desc">
                No problem. We&apos;ll ask a couple of extra questions to fill
                in the gaps.
              </div>
              <span className="branch-badge branch-badge-b">Quick start</span>
            </button>
          </div>

          <p className="dynamic-note">
            {state.path === "A"
              ? "Path A: 2 follow-up questions."
              : state.path === "B"
              ? "Path B: 3 follow-up questions."
              : "Path A: 2 follow-up questions. Path B: 3 follow-up questions."}{" "}
            Same results screen either way.
          </p>

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "24px" }}
            disabled={!canContinueJobTitle}
            onClick={handleJobTitleContinue}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Screen 01A: JD Upload/Paste (Path A) ──────────────────────────── */}
      {state.screen === "jdUpload" && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>
          <div className="path-indicator path-indicator-a">Path A: Job Description</div>

          <h1 className="screen-headline">Upload or paste your job description.</h1>
          <p className="screen-subheadline">
            Any format works. The more detail it has, the better your results.
          </p>

          {fileUploaded ? (
            <div className="upload-success">
              <span>✓</span>
              <span>{fileUploaded}</span>
            </div>
          ) : (
            <div
              className={`upload-zone ${isDragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">📄</div>
              <div className="upload-zone-label">Drag and drop your file here</div>
              <div className="upload-zone-sub">or click to browse</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                type="button"
              >
                Choose File
              </button>
              <div className="upload-formats">PDF, DOCX, TXT</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          )}

          <div className="divider-or">or</div>

          <textarea
            ref={textareaRef}
            className="textarea"
            placeholder="Or paste your job description here..."
            style={{ marginBottom: "24px" }}
            defaultValue={state.jobDescription}
          />

          <button
            className="btn btn-primary btn-full"
            onClick={handleJDContinue}
          >
            Start Saving Time →
          </button>
        </div>
      )}

      {/* ── Loading Screen ─────────────────────────────────────────────────── */}
      {state.screen === "loading" && (
        <div className="loading-screen" style={{ minHeight: "320px" }}>
          <div className="tool-tag" style={{ textAlign: "center" }}>AGENT: Timesaver</div>
          <div className="spinner" />
          <div className="loading-headline">Building personalized workflows...</div>
          <div className="loading-subline">Calculating hours saved...</div>
        </div>
      )}

      {/* ── Question Screens ──────────────────────────────────────────────── */}
      {state.screen === "question" && currentQuestion && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>

          <div
            className={`path-indicator ${state.path === "A" ? "path-indicator-a" : "path-indicator-b"}`}
          >
            {state.path === "A" ? "Path A: Job Description" : "Path B: Job Title"}
          </div>

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

          <div
            className="step-label"
            style={{ marginBottom: "16px" }}
          >
            Almost there. Question {state.questionIndex + 1} of {totalQuestions}.
          </div>

          <div className="question-stem">{currentQuestion.stem}</div>
          <div className="question-subheadline">{currentQuestion.subheadline}</div>

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

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "8px" }}
            disabled={!canContinueQuestion}
            onClick={handleNextQuestion}
          >
            {isLastQuestion ? "Show My Results →" : "Next →"}
          </button>
        </div>
      )}

      {/* ── Screen 06: Results ────────────────────────────────────────────── */}
      {state.screen === "results" && state.roi && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>

          <div className="results-tag">
            You could save {state.roi.totalHoursPerWeek} hours every week.
          </div>
          <h1 className="results-headline">Here&apos;s how:</h1>
          <p className="results-subheadline">
            Time estimates are calculated using your answers and publicly
            available industry data.
          </p>

          {/* Workflow Cards */}
          <div className="workflow-cards">
            {state.workflows.map((wf, i) => (
              <div key={i} className="workflow-card">
                <div className="workflow-label">Workflow 0{i + 1}</div>
                <div className="workflow-title">{wf.title}</div>
                <div className="workflow-desc">{wf.description}</div>
                <div className="workflow-time">
                  ⏱ Saves ~{wf.timeSavedPerWeek}h/week &mdash; {wf.tool}
                </div>
              </div>
            ))}
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

          {/* Email Capture — primary */}
          {!state.emailSaved && (
            <div className="save-card">
              <div className="save-card-headline">Want to save your results?</div>
              <div className="save-card-subline">
                We&apos;ll send them straight to your inbox.
              </div>
              <form onSubmit={handleEmailSave}>
                <div className="email-row">
                  <input
                    className="input"
                    type="email"
                    placeholder="Your email address..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    disabled={emailSending}
                  />
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={emailSending}
                  >
                    {emailSending ? "Sending..." : "Email Me My Results →"}
                  </button>
                </div>
                {emailError && (
                  <div style={{
                    marginTop: "8px",
                    fontSize: "0.875rem",
                    color: "#c0392b",
                  }}>
                    {emailError}
                  </div>
                )}
                <div className="trust-line">No spam. Just your results.</div>
              </form>
            </div>
          )}

          {/* Social Share */}
          <div className="share-row">
            <div className="share-label">Share your results</div>
            <div className="share-buttons">
              <a
                className="share-btn share-btn-x"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I could save ${state.roi.totalHoursPerWeek} hours every week with AI — find out how much time you're leaving on the table 👀`)}&url=${encodeURIComponent("https://promptaiagents.com")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </a>
              <a
                className="share-btn share-btn-li"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://promptaiagents.com")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Share on LinkedIn
              </a>
            </div>
          </div>

          {/* If email skipped — show gate card */}
          {!state.emailSaved && (
            <button
              className="btn btn-ghost btn-full"
              style={{ marginTop: "8px", fontSize: "0.875rem" }}
              onClick={() => go("gate")}
              type="button"
            >
              Skip — show me what else I can unlock
            </button>
          )}
        </div>
      )}

      {/* ── Screen 07: Gate ───────────────────────────────────────────────── */}
      {state.screen === "gate" && (
        <div className="screen">
          <div className="tool-tag">AGENT: Timesaver</div>

          <div className="gate-card">
            <div className="gate-headline">Want to go further?</div>
            <div className="gate-subline">Join free and get access to:</div>

            <ul className="gate-perks">
              {[
                "Workflows for more AI tools including Notion AI, Gemini, and Perplexity",
                "Results for any role or industry",
                "Written guides and tutorials, updated weekly",
                "The community — ask questions, share wins, stay sharp",
              ].map((perk, i) => (
                <li key={i} className="gate-perk">
                  <span className="perk-check">✓</span>
                  {perk}
                </li>
              ))}
            </ul>

            <form onSubmit={handleGateEmail}>
              <div className="email-row" style={{ marginBottom: "8px" }}>
                <input
                  className="input"
                  type="email"
                  placeholder="Your email address..."
                  value={emailGateInput}
                  onChange={(e) => setEmailGateInput(e.target.value)}
                  required
                />
                <button className="btn btn-primary" type="submit">
                  Get Free Access →
                </button>
              </div>
              <div className="trust-line">
                No spam. Just useful AI content, delivered with purpose.
              </div>
            </form>
          </div>

          <button
            className="btn btn-ghost btn-full"
            style={{ marginTop: "16px", fontSize: "0.875rem" }}
            onClick={handleSkipGate}
            type="button"
          >
            No thanks
          </button>
        </div>
      )}

      {/* ── Screen 08: Confirmation ───────────────────────────────────────── */}
      {state.screen === "confirm" && (
        <div className="screen" style={{ textAlign: "center" }}>
          <div className="tool-tag" style={{ textAlign: "center" }}>AGENT: Timesaver</div>

          <div className="confirm-icon">✅</div>
          <div className="confirm-headline">You&apos;re in.</div>
          <p className="confirm-subline">
            Check your inbox — your results and full workflow breakdown are on
            their way. Here&apos;s where to go next.
          </p>

          <div className="next-steps">
            <div className="next-step next-step-disabled">
              <span className="step-num">1</span>
              Community — coming soon
            </div>
            <a href={GUIDES_URL} className="next-step">
              <span className="step-num">2</span>
              Browse the hub and start with our beginner AI guide
            </a>
            <a href="#tool" className="next-step" onClick={() => {
              setState((s) => ({
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
                emailSaved: false,
              }));
              setJobTitleInput("");
              setEmailInput("");
              setEmailGateInput("");
              setFileUploaded(null);
            }}>
              <span className="step-num">3</span>
              Try another AGENT tool when you&apos;re ready
            </a>
          </div>

          <div className="confirm-cta-group">
            <a href={GUIDES_URL} className="btn btn-primary btn-full">
              Browse the Hub →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
