"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { track } from "@vercel/analytics";
import ToolEmailGate from "@/components/shared/ToolEmailGate";
import ToolLoadingScreen from "@/components/shared/ToolLoadingScreen";
import BackButton from "@/components/shared/BackButton";
import CrossSellBlock from "@/components/shared/CrossSellBlock";
import StepIndicator from "@/components/shared/StepIndicator";
import { blobToBase64, triggerDownload } from "@/components/shared/fileUtils";
import { useAuth } from "@/components/AuthProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "q1" | "q2" | "loading" | "ready" | "sent" | "error";

interface BudgetSection {
  name: string;
  rowCount: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const CONTENT_TYPES = [".xlsx", ".csv", ".txt"];
const TEMPLATE_TYPES = [".xlsx"];

function validateFile(file: File, accepted: string[]): string | null {
  if (file.size > MAX_FILE_SIZE) return "File is too large. Maximum size is 10 MB.";
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!accepted.includes(ext))
    return `Unsupported file type. Accepted: ${accepted.join(", ")}`;
  return null;
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
  id: string;
  label: string;
  sublabel: string;
  accept: string;
  file: File | null;
  error: string;
  onFile: (file: File | null) => void;
  onError: (msg: string) => void;
  accepted: string[];
}

function UploadZone({
  id,
  label,
  sublabel,
  accept,
  file,
  error,
  onFile,
  onError,
  accepted,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const err = validateFile(f, accepted);
    if (err) {
      onError(err);
      onFile(null);
      return;
    }
    onError("");
    onFile(f);
  }

  function handleRemove() {
    onFile(null);
    onError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={handleChange}
      />
      {file ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
          }}
        >
          <span style={{ color: "var(--cta, #1E7AB8)", fontSize: "0.875rem" }}>
            ✓
          </span>
          <span
            style={{
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.7)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.name}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              padding: "0",
              flexShrink: 0,
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          style={{ cursor: "pointer", display: "block", padding: "20px 16px" }}
        >
          <p
            style={{
              margin: "0 0 4px 0",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {label}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {sublabel}
          </p>
          <p
            style={{
              margin: "12px 0 0 0",
              fontSize: "0.8125rem",
              color: "var(--cta, #1E7AB8)",
            }}
          >
            Choose file
          </p>
        </label>
      )}
      {error && (
        <p
          style={{
            margin: "0",
            padding: "8px 16px",
            fontSize: "0.8125rem",
            color: "#e05555",
            background: "rgba(220,50,50,0.06)",
            borderTop: "1px solid rgba(220,50,50,0.15)",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BudgetSpreadsheetTool() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>("q1");
  const [description, setDescription] = useState("");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentFileError, setContentFileError] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateFileError, setTemplateFileError] = useState("");
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [filename, setFilename] = useState("budget.xlsx");
  const [budgetTitle, setBudgetTitle] = useState("");
  const [budgetSections, setBudgetSections] = useState<BudgetSection[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [flipStage, setFlipStage] = useState<"idle" | "in">("idle");

  const topRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const authSkipFired = useRef(false);

  // ── Track tool start ───────────────────────────────────────────
  useEffect(() => {
    track("tool_started");
  }, []);

  // ── Screen transitions ─────────────────────────────────────────
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

  // ── Auth: skip email gate if logged in ─────────────────────────
  useEffect(() => {
    if (screen === "ready" && user && !authSkipFired.current) {
      authSkipFired.current = true;
      setEmail(user.email);
      // Auto-submit: trigger download + email delivery, then go to sent
      (async () => {
        if (!fileBlob) return;
        triggerDownload(fileBlob, filename);
        try {
          const fileData = await blobToBase64(fileBlob);
          await fetch("/api/budget-spreadsheet-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, filename, budgetTitle, fileData }),
          });
        } catch { /* Email failure never blocks the user */ }
        track("email_submitted");
        go("sent");
      })();
    }
  }, [screen, user, fileBlob, filename, budgetTitle, go]);

  const flipClass = flipStage === "in" ? "screen-flip-in" : "";

  // ── Helpers ────────────────────────────────────────────────────
  const canSubmit = description.trim().length >= 10;
  const canSendEmail = email.trim().length > 3 && email.includes("@");

  // ── Generate ───────────────────────────────────────────────────
  async function handleGenerate() {
    go("loading");
    setErrorMsg("");
    track("generation_started");

    try {
      const form = new FormData();
      form.append("description", description.trim());
      if (contentFile) form.append("contentFile", contentFile);
      if (templateFile) form.append("templateFile", templateFile);

      const res = await fetch("/api/budget-spreadsheet", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ||
            "Generation failed. Please try again."
        );
      }

      const blob = await res.blob();
      const rawFilename = res.headers.get("X-Budget-Filename");
      const rawTitle = res.headers.get("X-Budget-Title");
      const rawSections = res.headers.get("X-Budget-Sections");

      setFileBlob(blob);
      setFilename(rawFilename ? decodeURIComponent(rawFilename) : "budget.xlsx");
      setBudgetTitle(rawTitle ? decodeURIComponent(rawTitle) : "Your Budget");

      if (rawSections) {
        try {
          const parsed = JSON.parse(
            decodeURIComponent(rawSections)
          ) as BudgetSection[];
          setBudgetSections(parsed);
        } catch {
          setBudgetSections([]);
        }
      }

      track("results_ready");
      go("ready");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      go("error");
    }
  }

  // ── Email submit ───────────────────────────────────────────────
  async function handleEmailSubmit() {
    if (!canSendEmail || !fileBlob || emailSubmitting) return;

    setEmailSubmitting(true);
    setEmailError("");

    // Fire download immediately — email failure never blocks the user
    triggerDownload(fileBlob, filename);

    try {
      const fileData = await blobToBase64(fileBlob);

      const res = await fetch("/api/budget-spreadsheet-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          filename,
          budgetTitle,
          fileData,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Email delivery failed."
        );
      }

      track("email_submitted");
      go("sent");
    } catch (err) {
      setEmailError(
        err instanceof Error
          ? err.message
          : "Email delivery failed. Your file should still have downloaded above."
      );
    } finally {
      setEmailSubmitting(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────
  function handleReset() {
    setScreen("q1");
    setDescription("");
    setContentFile(null);
    setContentFileError("");
    setTemplateFile(null);
    setTemplateFileError("");
    setFileBlob(null);
    setFilename("budget.xlsx");
    setBudgetTitle("");
    setBudgetSections([]);
    setErrorMsg("");
    setEmail("");
    setEmailError("");
    setEmailSubmitting(false);
    setFlipStage("idle");
  }

  // ─── Render ───────────────────────────────────────────────────

  // ── Screen: Q1 — Describe your budget ─────────────────────────
  if (screen === "q1") {
    return (
      <div
        className={`tool-container${flipClass ? ` ${flipClass}` : ""}`}
        ref={topRef}
      >
        <div className="screen">
          <StepIndicator total={2} current={1} />
          <p
            className="screen-headline"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
              lineHeight: 1.25,
            }}
          >
            What do you need a budget for?
          </p>
          <p className="screen-subheadline">
            Be specific. More detail means a better spreadsheet.
          </p>
          <textarea
            className="input"
            rows={5}
            style={{ resize: "vertical", marginBottom: "12px" }}
            placeholder={
              "e.g. Q3 marketing budget, $50K total, with categories for paid ads, content, and tools\n\ne.g. What if we added 2 headcount per department: model 3 scenarios"
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
          />
          {/* Deliverables preview — universal on every Q1 surface */}
          <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "14px" }}>
              What&apos;s included
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {["Custom Budget", "Built-In Formulas", "Scenario Modeling"].map((item) => (
                <div key={item} className="prompt-builder-kit-pill">
                  <span className="kit-item-check" style={{ fontSize: "0.75rem" }}>&#10003;</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "24px" }}
            onClick={() => {
              track("q1_completed");
              go("q2");
            }}
            disabled={!canSubmit}
            type="button"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ── Screen: Q2 — Optional files ────────────────────────────────
  if (screen === "q2") {
    return (
      <div
        className={`tool-container${flipClass ? ` ${flipClass}` : ""}`}
        ref={topRef}
      >
        <div className="screen">
          <BackButton onClick={() => go("q1")} />
          <StepIndicator total={2} current={2} />
          <p
            className="screen-headline"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
              lineHeight: 1.25,
            }}
          >
            Have data to work from?
          </p>
          <p className="screen-subheadline">
            Optional. Upload your own numbers or a spreadsheet you love. AI
            builds from scratch if you skip both.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <UploadZone
              id="content-file"
              label="Your data or notes"
              sublabel="Upload a file with line items, goals, or existing numbers. (.xlsx, .csv, .txt)"
              accept=".xlsx,.csv,.txt"
              accepted={CONTENT_TYPES}
              file={contentFile}
              error={contentFileError}
              onFile={setContentFile}
              onError={setContentFileError}
            />
            <UploadZone
              id="template-file"
              label="A budget you love"
              sublabel="Upload an .xlsx to match its structure and style."
              accept=".xlsx"
              accepted={TEMPLATE_TYPES}
              file={templateFile}
              error={templateFileError}
              onFile={setTemplateFile}
              onError={setTemplateFileError}
            />
          </div>

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "8px" }}
            onClick={() => {
              track("q2_completed", {
                hasContentFile: String(!!contentFile),
                hasTemplateFile: String(!!templateFile),
              });
              handleGenerate();
            }}
            disabled={!!contentFileError || !!templateFileError}
            type="button"
          >
            Generate My Spreadsheet
          </button>

          <p
            style={{
              marginTop: "12px",
              textAlign: "center",
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Downloads as .xlsx. Opens in Excel, Google Sheets, or Numbers.
          </p>
        </div>
      </div>
    );
  }

  // ── Screen: Loading ────────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div
        className={`tool-container${flipClass ? ` ${flipClass}` : ""}`}
        ref={topRef}
      >
        <div className="loading-screen" style={{ minHeight: "320px" }}>
          <ToolLoadingScreen headingText="Thinking" />
        </div>
      </div>
    );
  }

  // ── Screen: Ready — Email Gate ─────────────────────────────────
  if (screen === "ready") {
    const totalItems = budgetSections.reduce((sum, s) => sum + s.rowCount, 0);

    return (
      <div
        className={`tool-container${flipClass ? ` ${flipClass}` : ""}`}
        ref={topRef}
      >
        <div className="screen">
          <ToolEmailGate
            headline="Your spreadsheet is ready."
            subtitle={budgetTitle || undefined}
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleEmailSubmit}
            loading={emailSubmitting}
            buttonLabel="Send My Spreadsheet"
            errorMessage={emailError || undefined}
            inputId="budget-email"
          >
            {budgetSections.length > 0 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  marginBottom: "24px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {budgetSections.length} section
                  {budgetSections.length !== 1 ? "s" : ""} · {totalItems} line
                  item{totalItems !== 1 ? "s" : ""}
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  {budgetSections.map((s) => (
                    <div
                      key={s.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "rgba(255,255,255,0.7)",
                        }}
                      >
                        {s.name}
                      </span>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "rgba(255,255,255,0.3)",
                          flexShrink: 0,
                        }}
                      >
                        {s.rowCount} item{s.rowCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ToolEmailGate>
        </div>
      </div>
    );
  }

  // ── Screen: Sent ───────────────────────────────────────────────
  if (screen === "sent") {
    return (
      <div
        className={`tool-container${flipClass ? ` ${flipClass}` : ""}`}
        ref={topRef}
      >
        <div className="screen" style={{ paddingTop: "32px" }}>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.45)",
              marginBottom: "20px",
              marginTop: 0,
            }}
          >
            <span style={{ color: "#22C55E", marginRight: "6px" }}>✓</span>
            Sent to your inbox. File downloaded automatically.
          </p>

          <h2
            className="results-headline"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              marginBottom: budgetTitle ? "8px" : "10px",
            }}
          >
            Your spreadsheet is ready.
          </h2>
          {budgetTitle && (
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.55)", margin: "0 0 10px", textAlign: "center" }}>
              {budgetTitle}
            </p>
          )}
          <p
            className="screen-subheadline"
            style={{ marginTop: 0, marginBottom: "28px" }}
          >
            Open in Excel, Google Sheets, or Numbers. The &ldquo;How to Use&rdquo; tab walks you through every formula.
          </p>

          <button
            className="btn btn-primary btn-full"
            onClick={handleReset}
            type="button"
          >
            Build Another Spreadsheet
          </button>

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
      </div>
    );
  }

  // ── Screen: Error ──────────────────────────────────────────────
  return (
    <div
      className={`tool-container${flipClass ? ` ${flipClass}` : ""}`}
      ref={topRef}
    >
      <div className="screen">
        <p
          style={{
            fontSize: "0.875rem",
            color: "#e05555",
            marginBottom: "20px",
          }}
        >
          {errorMsg || "Something went wrong. Please try again."}
        </p>
        <button
          className="btn btn-primary btn-full"
          onClick={handleReset}
          type="button"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
