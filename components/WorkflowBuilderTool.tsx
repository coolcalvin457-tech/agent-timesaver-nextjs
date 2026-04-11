"use client";

import { useState, useEffect, useRef } from "react";
import ToolLoadingScreen from "@/components/shared/ToolLoadingScreen";
import CrossSellBlock from "@/components/shared/CrossSellBlock";
import BackButton from "@/components/shared/BackButton";
import StepIndicator from "@/components/shared/StepIndicator";
import QualitySignal from "@/components/shared/QualitySignal";
import { blobToBase64, triggerDownload } from "@/components/shared/fileUtils";
import { useAuth } from "@/components/AuthProvider";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Screen =
  | "s1"
  | "s2"
  | "s3"
  | "paywall"
  | "verifying"
  | "loading"
  | "sent"
  | "error";

type Frequency = "Daily" | "Weekly" | "Quarterly" | "1x Project";
type Collaboration = "Just me" | "Small team" | "Large team";

interface UploadedFile {
  name: string;
  type: string;
  data: string; // base64
}

interface SavedFormData {
  taskDescription: string;
  frequency: Frequency | "";
  collaboration: Collaboration | "";
  audiencePriorities: string;
  jobTitle: string;
  userTools: string;
}

// ─── In-browser results types (S149) ──────────────────────────────────────────

interface ResultItem {
  label: string;
  detail: string;
}

interface ResultSection {
  title: string;
  content: string;
  items?: ResultItem[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const WF_STORAGE_KEY = "wf_form_data";

const DELIVERABLES = [
  "Workflow Playbook",
  "AI Setup",
  "AI Prompts",
  "Time Estimates",
  "Key Insights",
];

// ─── Storage helpers ────────────────────────────────────────────────────────────

function saveToStorage(data: SavedFormData): void {
  try {
    sessionStorage.setItem(WF_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable — continue without saving
  }
}

function loadFromStorage(): SavedFormData | null {
  try {
    const raw = sessionStorage.getItem(WF_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedFormData) : null;
  } catch {
    return null;
  }
}

function clearStorage(): void {
  try {
    sessionStorage.removeItem(WF_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "0.9375rem",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical" as const,
  minHeight: "100px",
  lineHeight: 1.6,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "rgba(255,255,255,0.85)",
  marginBottom: "6px",
};

const optionalStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 400,
  color: "rgba(255,255,255,0.45)",
  marginLeft: "5px",
};

const errorStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  color: "#FF8A80",
  marginTop: "6px",
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: "28px",
};

/* radioOptionStyle removed (S148): Workflow S2 radio groups now use the shared
   .mc-tile CSS class for visual consistency with Prompts and Timesaver. */

// ─── Component ──────────────────────────────────────────────────────────────────

interface WorkflowBuilderToolProps {
  initialPaymentStatus?: string;
  initialSessionId?: string;
}

export default function WorkflowBuilderTool({
  initialPaymentStatus,
  initialSessionId,
}: WorkflowBuilderToolProps) {
  const { user } = useAuth();
  const toolContainerRef = useRef<HTMLDivElement>(null);
  const paywallRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // ── Screen ───────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("paywall");

  // ── Screen 1: The Task ───────────────────────────────────
  const [taskDescription, setTaskDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency | "">("");

  // ── Screen 2: The Context ────────────────────────────────
  const [collaboration, setCollaboration] = useState<Collaboration | "">("");
  const [audiencePriorities, setAudiencePriorities] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [userTools, setUserTools] = useState("");

  // ── Screen 3: Reference material ────────────────────────
  const [exampleFile, setExampleFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");

  // ── Error state ───────────────────────────────────────────
  const [s1Error, setS1Error] = useState("");
  const [s2Error, setS2Error] = useState("");
  const [s3Error, setS3Error] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Paywall state ─────────────────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paywallEmail, setPaywallEmail] = useState("");
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [subscriptionVerified, setSubscriptionVerified] = useState(false);
  const [subCheckLoading, setSubCheckLoading] = useState(false);
  const [showReturningCheck, setShowReturningCheck] = useState(false);
  const [returningEmail, setReturningEmail] = useState("");
  const [returningCheckLoading, setReturningCheckLoading] = useState(false);
  const [returningCheckError, setReturningCheckError] = useState("");

  // ── Build completion flag ─────────────────────────────────
  const [buildDone, setBuildDone] = useState(false);

  // ── Email (auto-send after build) ─────────────────────────
  const [email, setEmail] = useState("");

  // ── Result state ──────────────────────────────────────────
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [filename, setFilename] = useState("workflow.docx");
  const [resultTaskTitle, setResultTaskTitle] = useState("");
  const [resultStepCount, setResultStepCount] = useState("");
  const [resultFrequency, setResultFrequency] = useState("");
  const [resultSections, setResultSections] = useState<ResultSection[]>([]);
  const [copiedSectionIdx, setCopiedSectionIdx] = useState<number | null>(null);

  // ── Transition to sent when build completes (S152: no checklist) ──
  useEffect(() => {
    if (!buildDone || screen !== "loading") return;
    // Brief pause so the user sees the loading screen resolve, then transition
    const timer = setTimeout(() => setScreen("sent"), 600);
    return () => clearTimeout(timer);
  }, [buildDone, screen]);

  // ── Auth: pre-fill email (paid tool — do NOT auto-skip) ──
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setPaywallEmail(user.email);
    }
  }, [user]);

  // ── Auto-check subscription when logged-in user hits paywall ──
  useEffect(() => {
    if (screen !== "paywall" || !user?.email) return;
    if (initialPaymentStatus) return; // skip when returning from Stripe
    let cancelled = false;
    setSubCheckLoading(true);
    fetch("/api/verify-workflow-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    })
      .then((res) => res.json())
      .then((data: { verified: boolean }) => {
        if (!cancelled) {
          setSubscriptionVerified(data.verified);
          if (data.verified) setScreen("s1");
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSubCheckLoading(false); });
    return () => { cancelled = true; };
  }, [screen, user?.email, initialPaymentStatus]);

  // ── Scroll to tool container on screen change ────────────
  // S139: skip scroll when auto-advancing from paywall to s1 (subscriber
  // auto-check). The user just landed on the page and expects to see the
  // hero and landing content, not be yanked down to the tool. Only scroll
  // on explicit user-driven screen transitions (Continue button, etc.).
  const prevScreenRef = useRef<string>(screen);
  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = screen;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Auto-advance from paywall: don't scroll
    if (prev === "paywall" && screen === "s1") return;
    // Scroll to paywall screen itself (not the tool container) so headline is visible
    if (screen === "paywall" && paywallRef.current) {
      paywallRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    toolContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [screen]);

  // ── Restore form from storage helpers ────────────────────
  function restoreFromSaved(saved: SavedFormData): void {
    setTaskDescription(saved.taskDescription ?? "");
    setFrequency((saved.frequency as Frequency) ?? "");
    setCollaboration((saved.collaboration as Collaboration) ?? "");
    setAudiencePriorities(saved.audiencePriorities ?? "");
    setJobTitle(saved.jobTitle ?? "");
    setUserTools(saved.userTools ?? "");
  }

  // ── Payment detection on mount ────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialPaymentStatus) return;

    if (initialPaymentStatus === "cancelled") {
      clearStorage();
      setPaymentCancelled(true);
      setScreen("paywall");
      return;
    }

    if (initialPaymentStatus === "success" && initialSessionId) {
      setScreen("verifying");

      fetch(`/api/verify-payment?session_id=${initialSessionId}`)
        .then((r) => r.json())
        .then(({ verified }: { verified: boolean }) => {
          if (verified) {
            clearStorage();
            setSubscriptionVerified(true);
            setScreen("s1");
          } else {
            setCheckoutError(
              "Payment could not be verified. Please try again or contact results@promptaiagents.com."
            );
            setScreen("paywall");
          }
        })
        .catch(() => {
          setCheckoutError(
            "Something went wrong verifying your payment. Please contact results@promptaiagents.com."
          );
          setScreen("paywall");
        });
    }
  }, []); // intentionally run once on mount only

  // ── Restore after sign-in redirect ───────────────────────
  // After sign-in, the user lands back on the paywall (initial screen).
  // The auto-check subscription effect above handles verification.

  // ─── Build workflow ───────────────────────────────────────

  async function buildFromData(data: SavedFormData): Promise<void> {
    setScreen("loading");

    try {
      // Convert uploaded files to base64
      let exampleFileData: { name: string; type: string; data: string } | undefined;

      if (exampleFile) {
        const b64 = await blobToBase64(exampleFile);
        exampleFileData = { name: exampleFile.name, type: exampleFile.type, data: b64 };
      }

      const res = await fetch("/api/workflow-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskDescription: data.taskDescription,
          frequency: data.frequency,
          collaboration: data.collaboration,
          audiencePriorities: data.audiencePriorities || undefined,
          jobTitle: data.jobTitle || undefined,
          userTools: data.userTools || undefined,
          exampleFile: exampleFileData,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Build failed");
      }

      const { docxBase64, filename: wfFilename, sections, metadata } = json as {
        docxBase64: string;
        filename: string;
        sections: ResultSection[];
        metadata: { taskTitle: string; stepCount: string; frequency: string; jobTitle: string };
      };

      // Decode base64 .docx to Blob for download
      const binaryStr = atob(docxBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      setFileBlob(blob);
      setFilename(wfFilename);
      setResultTaskTitle(metadata.taskTitle);
      setResultStepCount(metadata.stepCount);
      setResultFrequency(metadata.frequency);
      setResultSections(sections);

      // Auto-deliver: download file + send email in background
      triggerDownload(blob, wfFilename);
      if (email) {
        // Email route still expects base64 fileData
        fetch("/api/workflow-builder-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            filename: wfFilename,
            taskTitle: metadata.taskTitle,
            stepCount: metadata.stepCount,
            frequency: metadata.frequency,
            fileData: docxBase64,
          }),
        }).catch(() => {});
      }

      // Signal build complete — the fast-forward effect will walk
      // remaining checklist steps and then transition to "sent".
      setBuildDone(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong on our end. Your input is saved. Hit Retry and we'll try again."
      );
      setScreen("error");
    }
  }

  // ─── Validate and proceed through screens ─────────────────

  function handleS1Continue(): void {
    if (!taskDescription.trim() || taskDescription.trim().length < 10) {
      setS1Error("Tell us a bit more about the task. More detail means a better workflow.");
      return;
    }
    setS1Error("");
    setScreen("s2");
  }

  function handleS2Continue(): void {
    if (!frequency) {
      setS2Error("Please select how often you do this task.");
      return;
    }
    if (!collaboration) {
      setS2Error("Please select who works on this with you.");
      return;
    }
    setS2Error("");
    setScreen("s3");
  }

  function handleCollaborationSelect(opt: Collaboration): void {
    setCollaboration(opt);
    if (frequency) {
      setS2Error("");
      setTimeout(() => setScreen("s3"), 180);
    }
  }

  function handleS3Build(): void {
    if (!jobTitle.trim()) {
      setS3Error("Please enter your job title so we can personalize your workflow.");
      return;
    }
    if (!userTools.trim()) {
      setS3Error("Please list the software you use so we can tailor your workflow.");
      return;
    }
    setS3Error("");
    buildFromData(currentFormData);
  }

  // ─── Stripe checkout ──────────────────────────────────────

  async function handleCheckout(): Promise<void> {
    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/workflow-builder-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error ?? "Could not start checkout. Please try again.");
        setCheckoutLoading(false);
      }
    } catch {
      setCheckoutError("Could not start checkout. Please try again.");
      setCheckoutLoading(false);
    }
  }

  // ─── Returning purchaser check ────────────────────────────

  async function handleReturningCheck(): Promise<void> {
    if (!returningEmail.trim()) {
      setReturningCheckError("Please enter your email address.");
      return;
    }
    setReturningCheckLoading(true);
    setReturningCheckError("");
    try {
      const res = await fetch("/api/verify-workflow-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: returningEmail.trim() }),
      });
      const data = await res.json() as { verified: boolean };
      if (data.verified) {
        setEmail(returningEmail.trim());
        setSubscriptionVerified(true);
        setReturningCheckError("");
        setShowReturningCheck(false);
        setScreen("s1");
      } else {
        setReturningCheckError("No active subscription found for that email. Try a different address or subscribe below.");
      }
    } catch {
      setReturningCheckError("Could not check subscription. Please try again.");
    } finally {
      setReturningCheckLoading(false);
    }
  }

  // ─── Sign-in redirect ─────────────────────────────────────

  function handleSignIn(): void {
    window.location.href = "/login?redirect=/workflow";
  }

  // ─── Reset ────────────────────────────────────────────────

  function handleReset(): void {
    setScreen("s1");
    setTaskDescription("");
    setFrequency("");
    setCollaboration("");
    setAudiencePriorities("");
    setJobTitle("");
    setUserTools("");
    setExampleFile(null);
    setFileError("");
    setFileBlob(null);
    setFilename("workflow.docx");
    setResultTaskTitle("");
    setResultStepCount("");
    setResultFrequency("");
    setResultSections([]);
    setCopiedSectionIdx(null);
    setEmail("");
    setS1Error("");
    setS2Error("");
    setS3Error("");
    setErrorMsg("");
    setCheckoutError("");
    setSubscriptionVerified(false);
    setPaymentCancelled(false);
    clearStorage();
  }

  // ─── Render ───────────────────────────────────────────────

  const currentFormData: SavedFormData = {
    taskDescription, frequency, collaboration, audiencePriorities, jobTitle, userTools,
  };

  return (
    <div
      ref={toolContainerRef}
      className="tool-container"
      style={{ scrollMarginTop: "136px" }}
    >

      {/* ── Verifying screen ──────────────────────────────── */}
      {screen === "verifying" && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9375rem" }}>
            Verifying your payment...
          </p>
        </div>
      )}

      {/* ── Loading screen (S152: sub-60s, no checklist) ──── */}
      {screen === "loading" && (
        <ToolLoadingScreen
          headingText="Building your workflow"
          timeEstimate="About 60 seconds"
          useBuildingDots
        />
      )}

      {/* ── Screen 1: The Task ────────────────────────────── */}
      {screen === "s1" && (
        <div className="screen">
          <StepIndicator total={3} current={1} />
          <h2
            style={{
              fontSize: "clamp(1.35rem, 2.5vw, 1.625rem)",
              fontWeight: 400,
              fontFamily: "var(--font-display)",
              color: "#FFFFFF",
              margin: "0 0 28px",
              lineHeight: 1.3,
            }}
          >
            Tell us about your task.
          </h2>

          {/* Task description */}
          <div style={fieldGroupStyle}>
            <label htmlFor="wf-task" style={labelStyle}>
              What would you like a workflow for?
            </label>
            <div style={{ position: "relative" }}>
              <textarea
                id="wf-task"
                style={{ ...textareaStyle, minHeight: "170px", paddingBottom: "28px" }}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder={"e.g. Onboard new clients from signed contract to first deliverable. This means sending them a welcome packet, scheduling the kickoff call, collecting brand assets and logins, assigning the internal team, and setting up the project in our tracking system. I'd rather spend that time building the actual relationship with the client and talking through their goals.\n"}
                rows={3}
                maxLength={500}
              />
              <span style={{ position: "absolute", bottom: "8px", right: "12px", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }}>
                {taskDescription.length === 0 ? "363" : taskDescription.length}/500
              </span>
            </div>
            <QualitySignal value={taskDescription} />
          </div>

          {/* Single upload — compact, centered */}
          <div style={{ marginTop: "4px", marginBottom: "20px", display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <label
                className="choose-file-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  color: exampleFile ? "var(--cta, #1E7AB8)" : "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${fileError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "8px",
                  padding: "7px 18px",
                }}
              >
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      setFileError("File must be under 5MB.");
                      setExampleFile(null);
                      e.target.value = "";
                      return;
                    }
                    setFileError("");
                    setExampleFile(file);
                  }}
                />
                {exampleFile ? `✓ ${exampleFile.name}` : "Upload file (optional)"}
              </label>
              {exampleFile && (
                <button
                  type="button"
                  onClick={() => { setExampleFile(null); setFileError(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    marginLeft: "10px",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            {fileError && (
              <p style={{ color: "#EF4444", fontSize: "0.8125rem", marginTop: "6px", textAlign: "center" }}>{fileError}</p>
            )}
          </div>

          {s1Error && <p style={errorStyle}>{s1Error}</p>}

          <button
            type="button"
            className="btn btn-dark-cta"
            style={{ width: "100%", marginTop: "8px" }}
            onClick={handleS1Continue}
          >
            Continue
          </button>
        </div>
      )}

      {/* ── Screen 2: The Context ─────────────────────────── */}
      {screen === "s2" && (
        <div className="screen">
          <BackButton onClick={() => setScreen("s1")} />
          <StepIndicator total={3} current={2} />
          <h2
            style={{
              fontSize: "clamp(1.35rem, 2.5vw, 1.625rem)",
              fontWeight: 400,
              fontFamily: "var(--font-display)",
              color: "#FFFFFF",
              margin: "0 0 28px",
              lineHeight: 1.3,
            }}
          >
            Tell us about the context.
          </h2>

          {/* Frequency */}
          <div style={{ ...fieldGroupStyle, marginBottom: "36px" }}>
            <label style={labelStyle}>How often do you do this?</label>
            <div className="mc-tile-grid" style={{ marginTop: "4px" }}>
              {(["Daily", "Weekly", "Quarterly", "1x Project"] as Frequency[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`mc-tile${frequency === opt ? " selected" : ""}`}
                  onClick={() => setFrequency(opt)}
                >
                  <span className="mc-tile-label">{opt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Collaboration */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Who works on this with you?</label>
            <div className="mc-tile-grid" style={{ marginTop: "4px" }}>
              {(["Just me", "Small team", "Large team"] as Collaboration[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`mc-tile${collaboration === opt ? " selected" : ""}`}
                  onClick={() => handleCollaborationSelect(opt)}
                >
                  <span className="mc-tile-label">{opt}</span>
                </button>
              ))}
            </div>
          </div>

          {s2Error && <p style={errorStyle}>{s2Error}</p>}

          <button
            type="button"
            className="btn btn-dark-cta"
            style={{ width: "100%", marginTop: "8px" }}
            onClick={handleS2Continue}
          >
            Continue
          </button>
        </div>
      )}

      {/* ── Screen 3: Reference material ──────────────────── */}
      {screen === "s3" && (
        <div className="screen">
          <BackButton onClick={() => setScreen("s2")} />
          <StepIndicator total={3} current={3} />
          <h2
            style={{
              fontSize: "clamp(1.35rem, 2.5vw, 1.625rem)",
              fontWeight: 400,
              fontFamily: "var(--font-display)",
              color: "#FFFFFF",
              margin: "0 0 28px",
              lineHeight: 1.3,
            }}
          >
            A few more details.
          </h2>

          {/* Job title (required) */}
          <div style={fieldGroupStyle}>
            <label htmlFor="wf-job-title" style={labelStyle}>
              Your job title
            </label>
            <input
              id="wf-job-title"
              type="text"
              style={inputStyle}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Client Services Director"
            />
          </div>

          {/* Tools (required) */}
          <div style={fieldGroupStyle}>
            <label htmlFor="wf-tools" style={labelStyle}>
              What software do you use for this task?
            </label>
            <input
              id="wf-tools"
              type="text"
              style={inputStyle}
              value={userTools}
              onChange={(e) => setUserTools(e.target.value)}
              placeholder="e.g. Google Workspace, Microsoft Copilot, Slack"
            />
          </div>

          {/* Audience and priorities (optional) */}
          <div style={fieldGroupStyle}>
            <label htmlFor="wf-audience" style={labelStyle}>
              Who reviews this when it's done?
              <span style={optionalStyle}>(optional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <textarea
                id="wf-audience"
                style={{ ...textareaStyle, minHeight: "70px", paddingBottom: "24px" }}
                value={audiencePriorities}
                onChange={(e) => setAudiencePriorities(e.target.value)}
                placeholder="e.g. Our VP reviews it. She likes clear bullet point summaries, next steps outlined below, and no fluff or long paragraphs."
                rows={2}
                maxLength={500}
              />
              <span style={{ position: "absolute", bottom: "8px", right: "12px", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }}>
                {audiencePriorities.length === 0 ? "120" : audiencePriorities.length}/500
              </span>
            </div>
          </div>

          {s3Error && <p style={errorStyle}>{s3Error}</p>}

          <button
            type="button"
            className="btn btn-dark-cta"
            style={{ width: "100%", marginTop: "8px" }}
            onClick={handleS3Build}
          >
            Build My Workflow
          </button>
        </div>
      )}

      {/* ── Paywall ───────────────────────────────────────── */}
      {screen === "paywall" && (
        <div ref={paywallRef} className="screen" style={{ background: "#161618", paddingTop: "32px", paddingBottom: "20px", scrollMarginTop: "100px" }}>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)",
              fontWeight: 400,
              fontFamily: "var(--font-display)",
              color: "#FFFFFF",
              margin: "0 0 28px",
              lineHeight: 1.2,
            }}
          >
            Turn Long Tasks into AI Workflows.
          </h2>

          {paymentCancelled && (
            <p style={{ fontSize: "0.875rem", color: "rgba(255,200,80,0.9)", marginBottom: "16px" }}>
              Checkout was cancelled. Your inputs are still here.
            </p>
          )}

          {/* What's included */}
          <div
            style={{
              background: "radial-gradient(ellipse 80% 90% at center, rgba(30,122,184,0.14) 0%, transparent 65%)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "10px",
              padding: "18px 20px",
              marginLeft: "26px",
              marginRight: "26px",
              marginBottom: "12px",
              animation: "fadeUp 0.4s ease both",
              animationDelay: "0.1s",
            }}
          >
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              What&apos;s Included
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "4px" }}>
              {DELIVERABLES.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: "var(--cta, #1E7AB8)" }}>
                    <path d="M2.5 1.5h6l3 3v8h-9v-11z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
                    <path d="M8.5 1.5v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.70)", fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing card */}
          {subscriptionVerified ? (
            <div
              style={{
                background: "var(--dark, #161618)",
                borderRadius: "12px",
                padding: "24px 26px",
                marginBottom: "16px",
              }}
            >
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#FFFFFF" }}>
                  Workflow Builder
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: "rgba(34,197,94,0.2)",
                    color: "#4ADE80",
                    border: "1px solid rgba(34,197,94,0.35)",
                  }}
                >
                  Active
                </span>
              </div>

              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: "0 0 16px" }}>
                Your subscription is active. Build as many workflows as you need.
              </p>

              <button
                type="button"
                onClick={() => setScreen("s1")}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  background: "#1E7AB8",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                Get Started
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "var(--dark, #161618)",
                borderRadius: "12px",
                padding: "24px 28px 24px 37px",
                marginBottom: "0",
                animation: "fadeUp 0.4s ease both",
                animationDelay: "0.2s",
              }}
            >
              {/* Header row: tool name left, badge right */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                  Workflow Builder
                </p>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: "rgba(30,122,184,0.25)",
                    color: "#60B4F0",
                    border: "1px solid rgba(30,122,184,0.20)",
                  }}
                >
                  Annual Subscription
                </span>
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: "24px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>$49</span>
                <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>/year</span>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", margin: "0 0 28px" }} />

              {/* CTA */}
              <button
                type="button"
                className="btn-paywall-cta"
                onClick={handleCheckout}
                disabled={checkoutLoading}
                style={{
                  maxWidth: "320px",
                  width: "100%",
                  margin: "0 auto",
                  display: "block",
                  padding: "11px 20px",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  background: checkoutLoading ? "rgba(30,122,184,0.5)" : "#1E7AB8",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  cursor: checkoutLoading ? "not-allowed" : "pointer",
                }}
              >
                {checkoutLoading ? "Redirecting to checkout..." : "Get Access"}
              </button>

              {checkoutError && (
                <p style={{ fontSize: "0.8125rem", color: "#F87171", margin: "12px 0 0" }}>
                  {checkoutError}
                </p>
              )}

              {/* Sign-in link — inside pricing card */}
              {!user && (
                <p style={{ fontSize: "0.8125rem", textAlign: "center", margin: "16px 0 0" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Already have an account? </span>
                  <button
                    type="button"
                    onClick={handleSignIn}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: "0.8125rem",
                      color: "#60B4F0",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Sent (auto-delivered) ────────────────────────── */}
      {screen === "sent" && (
        <div className="result-screen-enter">
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ display: "inline-block", marginBottom: "16px" }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="12" fill="#22C55E" fillOpacity="0.12" />
              <path d="M18 28.5L24.5 35L38 21" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
              fontWeight: 400,
              fontFamily: "var(--font-display)",
              color: "#FFFFFF",
              margin: "0 0 8px",
              lineHeight: 1.25,
            }}
          >
            Your workflow is ready.
          </h2>
          {/* F38: Job title echo */}
          {jobTitle && (
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.55)", margin: "0 0 8px", textAlign: "center" }}>
              {jobTitle}{resultTaskTitle ? ` · ${resultTaskTitle}` : ""}
            </p>
          )}
          {!jobTitle && resultTaskTitle && (
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.55)", margin: "0 0 8px", textAlign: "center" }}>
              {resultTaskTitle}
            </p>
          )}
        </div>

        {/* ── In-browser results (S153) ──────────────────── */}
        {resultSections.length > 0 && (
          <div style={{ marginTop: "40px", textAlign: "left" }}>
            {resultSections.map((section, idx) => (
              <div
                key={idx}
                className="result-section-card"
              >
                {/* Section eyebrow */}
                <p className="result-eyebrow">
                  {String(idx + 1).padStart(2, "0")} {section.title}
                </p>

                {/* Copy button — top-right */}
                <button
                  type="button"
                  className={`result-copy-btn${copiedSectionIdx === idx ? " copied" : ""}`}
                  onClick={() => {
                    const text = section.items
                      ? section.content + "\n\n" + section.items.map((it) => `${it.label}\n${it.detail}`).join("\n\n")
                      : section.content;
                    navigator.clipboard.writeText(text).then(() => {
                      setCopiedSectionIdx(idx);
                      setTimeout(() => setCopiedSectionIdx(null), 2000);
                    }).catch(() => {});
                  }}
                >
                  {copiedSectionIdx === idx ? "\u2713 Copied" : "Copy"}
                </button>

                {/* Section body: overview / content prose */}
                {section.content && (
                  <div style={{ marginBottom: section.items?.length ? "16px" : "0" }}>
                    {section.content.split("\n\n").map((para, pIdx) => (
                      <p
                        key={pIdx}
                        style={{
                          fontSize: "0.9375rem",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.80)",
                          margin: `0 0 ${pIdx < section.content.split("\n\n").length - 1 ? "16px" : "0"}`,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {/* Structured sub-items (steps, prompts, time breakdown) */}
                {section.items && section.items.length > 0 && (
                  <div>
                    {section.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        style={{
                          paddingTop: iIdx > 0 ? "12px" : "0",
                          borderTop: iIdx > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                          marginTop: iIdx > 0 ? "12px" : "0",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.85)",
                            margin: "0 0 4px",
                          }}
                        >
                          {item.label}
                        </p>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            lineHeight: 1.65,
                            color: "rgba(255,255,255,0.65)",
                            margin: 0,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Build another — after results, before cross-sell */}
        <div style={{ marginTop: "32px", marginBottom: "16px" }}>
          <button
            type="button"
            className="btn btn-primary btn-lg btn-full"
            onClick={handleReset}
          >
            Build another workflow
          </button>
        </div>

        {/* Cross-sell: AGENT: Industry */}
        <CrossSellBlock
          productName="AGENT: Industry"
          checklistItems={[
            "Intel Report",
            "Relevant Insights",
            "Role-Specific",
          ]}
          buttonLabel="Try Now"
          href="/industry"
        />
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {screen === "error" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p
            style={{
              fontSize: "clamp(1.1rem, 2vw, 1.25rem)",
              fontWeight: 400,
              fontFamily: "var(--font-display)",
              color: "#FFFFFF",
              margin: "0 0 8px",
              lineHeight: 1.4,
            }}
          >
            Something went wrong on our end.
          </p>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", margin: "0 0 28px" }}>
            {errorMsg || "Your input is saved. Hit Retry and we'll try again."}
          </p>
          <button
            type="button"
            className="btn btn-dark-cta"
            onClick={() => buildFromData(currentFormData)}
            style={{ marginBottom: "12px" }}
          >
            Retry
          </button>
          <br />
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.45)",
              textDecoration: "underline",
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            Start over
          </button>
        </div>
      )}

    </div>
  );
}

