"use client";

import { useState, useEffect, useRef } from "react";
import ToolEmailGate from "@/components/shared/ToolEmailGate";
import ToolLoadingScreen from "@/components/shared/ToolLoadingScreen";
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
  | "email-gate"
  | "sent"
  | "error";

type Frequency = "Daily" | "Weekly" | "Monthly" | "1x Project";
type Collaboration = "Just me" | "Small team" | "Big team";

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

// ─── Constants ─────────────────────────────────────────────────────────────────

const WF_STORAGE_KEY = "wf_form_data";

const LOADING_STEPS = [
  "Analyzing your task",
  "Mapping the steps",
  "Selecting the right tools",
  "Writing your prompts",
  "Formatting your workflow doc",
];

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
  borderRadius: "6px",
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
  marginBottom: "20px",
};

const radioOptionStyle = (selected: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "10px 14px",
  border: `1px solid ${selected ? "var(--cta, #1E7AB8)" : "rgba(255,255,255,0.14)"}`,
  borderRadius: "8px",
  cursor: "pointer",
  background: selected ? "rgba(30,122,184,0.18)" : "rgba(255,255,255,0.05)",
  transition: "border-color 0.15s ease, background 0.15s ease",
});

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
  const isFirstRender = useRef(true);

  // ── Screen ───────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("s1");

  // ── Screen 1: The Task ───────────────────────────────────
  const [taskDescription, setTaskDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency | "">("");

  // ── Screen 2: The Context ────────────────────────────────
  const [collaboration, setCollaboration] = useState<Collaboration | "">("");
  const [audiencePriorities, setAudiencePriorities] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [userTools, setUserTools] = useState("");

  // ── Screen 3: Reference material ────────────────────────
  const [processFile, setProcessFile] = useState<File | null>(null);
  const [exampleFile, setExampleFile] = useState<File | null>(null);

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

  // ── Loading animation ─────────────────────────────────────
  const [loadingStep, setLoadingStep] = useState(0);

  // ── Email gate ────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ── Result state ──────────────────────────────────────────
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [filename, setFilename] = useState("workflow.docx");
  const [resultTaskTitle, setResultTaskTitle] = useState("");
  const [resultStepCount, setResultStepCount] = useState("");
  const [resultFrequency, setResultFrequency] = useState("");

  // ── Loading animation ─────────────────────────────────────
  useEffect(() => {
    if (screen !== "loading") return;
    setLoadingStep(0);
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [screen]);

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
    let cancelled = false;
    setSubCheckLoading(true);
    fetch("/api/verify-workflow-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    })
      .then((res) => res.json())
      .then((data: { verified: boolean }) => {
        if (!cancelled) setSubscriptionVerified(data.verified);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSubCheckLoading(false); });
    return () => { cancelled = true; };
  }, [screen, user?.email]);

  // ── Scroll to tool container on screen change ────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
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

    const saved = loadFromStorage();

    if (initialPaymentStatus === "cancelled") {
      if (saved) restoreFromSaved(saved);
      clearStorage();
      setPaymentCancelled(true);
      setScreen("paywall");
      return;
    }

    if (initialPaymentStatus === "success" && initialSessionId) {
      if (!saved) {
        setErrorMsg(
          "Your payment was successful, but we couldn't recover your form data. Please contact us at results@promptaiagents.com and we'll sort it out."
        );
        setScreen("error");
        return;
      }

      restoreFromSaved(saved);
      setScreen("verifying");

      fetch(`/api/verify-payment?session_id=${initialSessionId}`)
        .then((r) => r.json())
        .then(({ verified }: { verified: boolean }) => {
          if (verified) {
            clearStorage();
            buildFromData(saved);
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

  // ── Restore form after sign-in redirect ──────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (initialPaymentStatus) return;
    try {
      const returnFlag = sessionStorage.getItem("wf_return_to_paywall");
      if (!returnFlag) return;
      sessionStorage.removeItem("wf_return_to_paywall");
      const saved = loadFromStorage();
      if (saved) {
        restoreFromSaved(saved);
        clearStorage();
      }
      setScreen("paywall");
    } catch {
      // ignore
    }
  }, []); // intentionally run once on mount only

  // ─── Build workflow ───────────────────────────────────────

  async function buildFromData(data: SavedFormData): Promise<void> {
    setScreen("loading");

    try {
      // Convert uploaded files to base64
      let processFileData: { name: string; type: string; data: string } | undefined;
      let exampleFileData: { name: string; type: string; data: string } | undefined;

      if (processFile) {
        const b64 = await blobToBase64(processFile);
        processFileData = { name: processFile.name, type: processFile.type, data: b64 };
      }
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
          processFile: processFileData,
          exampleFile: exampleFileData,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Build failed");
      }

      const blob = await res.blob();
      const wfFilename = decodeURIComponent(res.headers.get("X-WF-Filename") ?? "workflow.docx");
      const taskTitle = decodeURIComponent(res.headers.get("X-Task-Title") ?? data.taskDescription);
      const stepCount = res.headers.get("X-Step-Count") ?? "";
      const freq = decodeURIComponent(res.headers.get("X-Frequency") ?? data.frequency);

      setFileBlob(blob);
      setFilename(wfFilename);
      setResultTaskTitle(taskTitle);
      setResultStepCount(stepCount);
      setResultFrequency(freq);

      setScreen("email-gate");
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
    setS3Error("");
    setScreen("paywall");
  }

  // ─── Stripe checkout ──────────────────────────────────────

  async function handleCheckout(): Promise<void> {
    setCheckoutLoading(true);
    setCheckoutError("");

    // Save form state before redirecting to Stripe
    saveToStorage({
      taskDescription,
      frequency,
      collaboration,
      audiencePriorities,
      jobTitle,
      userTools,
    });

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
      } else {
        setReturningCheckError("No active subscription found for that email. Try a different address or subscribe below.");
      }
    } catch {
      setReturningCheckError("Could not check subscription. Please try again.");
    } finally {
      setReturningCheckLoading(false);
    }
  }

  // ─── Email submit ─────────────────────────────────────────

  async function handleEmailSubmit(): Promise<void> {
    if (!email.trim() || !email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!fileBlob) {
      setEmailError("Something went wrong. Please start over.");
      return;
    }

    setEmailSubmitting(true);
    setEmailError("");

    // Fire browser download immediately
    triggerDownload(fileBlob, filename);

    // Send email in background
    try {
      const fileData = await blobToBase64(fileBlob);
      await fetch("/api/workflow-builder-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          filename,
          taskTitle: resultTaskTitle,
          stepCount: resultStepCount,
          frequency: resultFrequency,
          fileData,
        }),
      });
    } catch {
      // Email failure is non-blocking — download already fired
    }

    setEmailSubmitting(false);
    setScreen("sent");
  }

  // ─── Sign-in redirect ─────────────────────────────────────

  function handleSignIn(): void {
    saveToStorage({ taskDescription, frequency, collaboration, audiencePriorities, jobTitle, userTools });
    try {
      sessionStorage.setItem("wf_return_to_paywall", "1");
    } catch {
      // ignore
    }
    window.location.href = "/login?redirect=/workflow-builder";
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
    setProcessFile(null);
    setExampleFile(null);
    setFileBlob(null);
    setFilename("workflow.docx");
    setResultTaskTitle("");
    setResultStepCount("");
    setResultFrequency("");
    setEmail("");
    setEmailError("");
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

      {/* ── Loading screen ────────────────────────────────── */}
      {screen === "loading" && (
        <ToolLoadingScreen
          steps={LOADING_STEPS}
          activeStep={loadingStep}
          timeEstimate="About 1 minute."
          headingText="Building your workflow."
        />
      )}

      {/* ── Screen 1: The Task ────────────────────────────── */}
      {screen === "s1" && (
        <>
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
              What task do you want a workflow for?
            </label>
            <textarea
              id="wf-task"
              style={{ ...textareaStyle, minHeight: "90px" }}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="e.g. Write a competitive analysis for a new product launch."
              rows={3}
            />
            <QualitySignal value={taskDescription} />
          </div>

          {/* Upload zone 1 — compact bar */}
          <div style={{ marginTop: "4px", marginBottom: "16px", display: "flex", alignItems: "center" }}>
            <label
              className="choose-file-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: processFile ? "var(--cta, #1E7AB8)" : "rgba(255,255,255,0.55)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 14px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <input
                type="file"
                accept=".txt,.md,.pdf,.docx"
                style={{ display: "none" }}
                onChange={(e) => setProcessFile(e.target.files?.[0] ?? null)}
              />
              {processFile ? `✓ ${processFile.name}` : "Upload workflow example (optional)"}
            </label>
            {processFile && (
              <button
                type="button"
                onClick={() => setProcessFile(null)}
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

          {/* Upload zone 2 — compact bar */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}>
            <label
              className="choose-file-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: exampleFile ? "var(--cta, #1E7AB8)" : "rgba(255,255,255,0.55)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 14px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <input
                type="file"
                accept=".txt,.md,.pdf,.docx"
                style={{ display: "none" }}
                onChange={(e) => setExampleFile(e.target.files?.[0] ?? null)}
              />
              {exampleFile ? `✓ ${exampleFile.name}` : "Upload finished product example (optional)"}
            </label>
            {exampleFile && (
              <button
                type="button"
                onClick={() => setExampleFile(null)}
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

          {s1Error && <p style={errorStyle}>{s1Error}</p>}

          <button
            type="button"
            className="btn btn-dark-cta"
            style={{ width: "100%", marginTop: "8px" }}
            onClick={handleS1Continue}
          >
            Continue
          </button>
        </>
      )}

      {/* ── Screen 2: The Context ─────────────────────────── */}
      {screen === "s2" && (
        <>
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
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", marginTop: "4px" }}>
              {(["Daily", "Weekly", "Monthly", "1x Project"] as Frequency[]).map((opt) => (
                <label
                  key={opt}
                  style={radioOptionStyle(frequency === opt)}
                  onClick={() => setFrequency(opt)}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={opt}
                    checked={frequency === opt}
                    onChange={() => setFrequency(opt)}
                    style={{ marginTop: "2px", accentColor: "var(--cta, #1E7AB8)", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Collaboration */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Who works on this with you?</label>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", marginTop: "4px" }}>
              {(["Just me", "Small team", "Big team"] as Collaboration[]).map((opt) => (
                <label
                  key={opt}
                  style={radioOptionStyle(collaboration === opt)}
                  onClick={() => handleCollaborationSelect(opt)}
                >
                  <input
                    type="radio"
                    name="collaboration"
                    value={opt}
                    checked={collaboration === opt}
                    onChange={() => handleCollaborationSelect(opt)}
                    style={{ marginTop: "2px", accentColor: "var(--cta, #1E7AB8)", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                    {opt}
                  </span>
                </label>
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
        </>
      )}

      {/* ── Screen 3: Reference material ──────────────────── */}
      {screen === "s3" && (
        <>
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
            Help us personalize it.
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
              placeholder="e.g. Marketing Manager"
            />
          </div>

          {/* Audience and priorities (optional) */}
          <div style={{ ...fieldGroupStyle, marginBottom: "12px" }}>
            <label htmlFor="wf-audience" style={labelStyle}>
              Who sees the finished result, and what matters most to them?
              <span style={optionalStyle}>(optional)</span>
            </label>
            <textarea
              id="wf-audience"
              style={{ ...textareaStyle, minHeight: "70px" }}
              value={audiencePriorities}
              onChange={(e) => setAudiencePriorities(e.target.value)}
              placeholder="e.g. My director reviews it. She cares about the recovery plan, not the excuses."
              rows={2}
            />
          </div>

          {/* Tools (optional) */}
          <div style={fieldGroupStyle}>
            <label htmlFor="wf-tools" style={labelStyle}>
              Any tools or apps you already use?
              <span style={optionalStyle}>(optional)</span>
            </label>
            <input
              id="wf-tools"
              type="text"
              style={inputStyle}
              value={userTools}
              onChange={(e) => setUserTools(e.target.value)}
              placeholder="e.g. Google Workspace, Slack, Notion"
            />
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
        </>
      )}

      {/* ── Paywall ───────────────────────────────────────── */}
      {screen === "paywall" && (
        <>
          <BackButton onClick={() => setScreen("s3")} />

          <h2
            style={{
              fontSize: "clamp(1.35rem, 2.5vw, 1.625rem)",
              fontWeight: 400,
              fontFamily: "var(--font-display)",
              color: "#FFFFFF",
              margin: "0 0 20px",
              lineHeight: 1.3,
            }}
          >
            Your workflow is almost ready.
          </h2>

          {paymentCancelled && (
            <p style={{ fontSize: "0.875rem", color: "rgba(255,200,80,0.9)", marginBottom: "16px" }}>
              Checkout was cancelled. Your inputs are still here.
            </p>
          )}

          {/* What's included */}
          <div
            style={{
              marginBottom: "24px",
              padding: "0 4px",
            }}
          >
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "12px",
              }}
            >
              Your workflow includes
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {DELIVERABLES.map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "7px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.12)",
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cta, #1E7AB8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing card */}
          <div
            style={{
              background: "var(--dark, #161618)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "16px",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "var(--cta, #1E7AB8)",
                  margin: "0 0 6px",
                }}
              >
                Annual Subscription
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  margin: "0 0 4px",
                  lineHeight: 1.2,
                }}
              >
                $49 <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>/year</span>
              </p>
              <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
                Unlimited workflows for any task, any job title.
              </p>
            </div>

            {/* Subscription active badge for verified users */}
            {subscriptionVerified && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.30)",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: "0.875rem", color: "#22C55E", fontWeight: 600 }}>
                  Active subscription confirmed
                </span>
              </div>
            )}

            {subCheckLoading && (
              <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>
                Checking subscription...
              </p>
            )}

            {subscriptionVerified ? (
              <button
                type="button"
                className="btn btn-dark-cta"
                style={{ width: "100%" }}
                onClick={() => buildFromData(currentFormData)}
              >
                Build My Workflow
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-dark-cta"
                style={{ width: "100%", opacity: checkoutLoading ? 0.7 : 1 }}
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? "Redirecting to checkout..." : "Get Access · $49/year"}
              </button>
            )}

            {checkoutError && (
              <p style={{ ...errorStyle, color: "rgba(255,120,100,0.9)", marginTop: "10px" }}>
                {checkoutError}
              </p>
            )}

            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)", textAlign: "center", margin: "12px 0 0" }}>
              Annual subscription. Cancel anytime.
            </p>

            {/* Sign-in link — only shown when NOT logged in */}
            {!user && (
              <p style={{ fontSize: "0.8125rem", textAlign: "center", margin: "10px 0 0" }}>
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

          {/* Returning purchaser check */}
          {!subscriptionVerified && (
            <div style={{ marginTop: "4px" }}>
              {!showReturningCheck ? (
                <button
                  type="button"
                  onClick={() => setShowReturningCheck(true)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.45)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    display: "block",
                    margin: "0 auto",
                  }}
                >
                  Already have access? Enter your email.
                </button>
              ) : (
                <div style={{ padding: "16px", background: "var(--surface-secondary, #F9F9F7)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                  <label htmlFor="wf-returning-email" style={{ ...labelStyle, marginBottom: "8px" }}>
                    Enter your email to verify access
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      id="wf-returning-email"
                      type="email"
                      style={{ ...inputStyle, flex: 1 }}
                      value={returningEmail}
                      onChange={(e) => setReturningEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                    <button
                      type="button"
                      className="btn btn-dark-cta"
                      style={{ whiteSpace: "nowrap" as const, padding: "10px 16px", fontSize: "0.875rem" }}
                      onClick={handleReturningCheck}
                      disabled={returningCheckLoading}
                    >
                      {returningCheckLoading ? "Checking..." : "Verify"}
                    </button>
                  </div>
                  {returningCheckError && <p style={errorStyle}>{returningCheckError}</p>}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Email gate ────────────────────────────────────── */}
      {screen === "email-gate" && (
        <>
          {/* Preview summary block */}
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "10px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "var(--cta, #1E7AB8)",
                margin: "0 0 10px",
              }}
            >
              Your workflow includes
            </p>
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#FFFFFF", margin: "0 0 6px", lineHeight: 1.3 }}>
              {resultTaskTitle}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px 16px" }}>
              {resultStepCount && (
                <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
                  {resultStepCount}-step workflow
                </span>
              )}
              {resultFrequency && (
                <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
                  {resultFrequency}
                </span>
              )}
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
                Formatted .docx: ready to use and share
              </span>
            </div>
          </div>

          <ToolEmailGate
            headline="Your workflow is ready."
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleEmailSubmit}
            loading={emailSubmitting}
            buttonLabel="Send My Workflow"
            errorMessage={emailError}
          />
        </>
      )}

      {/* ── Sent ──────────────────────────────────────────── */}
      {screen === "sent" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ marginBottom: "16px" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="#22C55E" fillOpacity="0.12" />
              <path d="M15 24.5L21 31L33 18" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: "clamp(1.35rem, 2.5vw, 1.625rem)",
              fontWeight: 400,
              fontFamily: "var(--font-display)",
              color: "#FFFFFF",
              margin: "0 0 8px",
              lineHeight: 1.3,
            }}
          >
            Your workflow is in your inbox.
          </h2>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", margin: "0 0 32px" }}>
            Check your email for {email}.
          </p>
          <button
            type="button"
            className="btn btn-dark-cta"
            onClick={handleReset}
          >
            Build another workflow
          </button>
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

