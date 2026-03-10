"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "input" | "loading" | "ready" | "sent" | "error";

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
  if (!accepted.includes(ext)) return `Unsupported file type. Accepted: ${accepted.join(", ")}`;
  return null;
}

// Convert a Blob to a base64 string (for email attachment)
async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
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

function UploadZone({ id, label, sublabel, accept, file, error, onFile, onError, accepted }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const err = validateFile(f, accepted);
    if (err) { onError(err); onFile(null); return; }
    onError("");
    onFile(f);
  }

  function handleRemove() {
    onFile(null);
    onError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="bs-upload-zone">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="bs-upload-input"
        onChange={handleChange}
      />
      {file ? (
        <div className="bs-upload-selected">
          <span className="bs-upload-icon-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="none"/>
              <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="bs-upload-filename">{file.name}</span>
          <button
            type="button"
            className="bs-upload-remove"
            onClick={handleRemove}
            aria-label="Remove file"
          >
            ×
          </button>
        </div>
      ) : (
        <label htmlFor={id} className="bs-upload-label">
          <span className="bs-upload-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V8M9 11l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </span>
          <span className="bs-upload-label-text">
            <strong>{label}</strong>
            <span>{sublabel}</span>
          </span>
        </label>
      )}
      {error && <p className="bs-upload-error">{error}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BudgetSpreadsheetTool() {
  const [screen, setScreen] = useState<Screen>("input");
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

  // Email gate state
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  const canSubmit =
    description.trim().length >= 10 &&
    !contentFileError &&
    !templateFileError;

  const canSendEmail = email.trim().length > 3 && email.includes("@");

  // ── Generate ──────────────────────────────────────────────────
  async function handleGenerate() {
    if (!canSubmit) return;
    setScreen("loading");
    setErrorMsg("");

    try {
      const form = new FormData();
      form.append("description", description.trim());
      if (contentFile)  form.append("contentFile",  contentFile);
      if (templateFile) form.append("templateFile", templateFile);

      const res = await fetch("/api/budget-spreadsheet", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Generation failed. Please try again.");
      }

      const blob = await res.blob();
      const rawFilename = res.headers.get("X-Budget-Filename");
      const rawTitle    = res.headers.get("X-Budget-Title");
      const rawSections = res.headers.get("X-Budget-Sections");

      setFileBlob(blob);
      setFilename(rawFilename ? decodeURIComponent(rawFilename) : "budget.xlsx");
      setBudgetTitle(rawTitle ? decodeURIComponent(rawTitle) : "Your Budget");

      if (rawSections) {
        try {
          const parsed = JSON.parse(decodeURIComponent(rawSections)) as BudgetSection[];
          setBudgetSections(parsed);
        } catch {
          setBudgetSections([]);
        }
      }

      setScreen("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setScreen("error");
    }
  }

  // ── Trigger browser download ───────────────────────────────────
  function triggerDownload(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Email submit: download + send simultaneously ───────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSendEmail || !fileBlob || emailSubmitting) return;

    setEmailSubmitting(true);
    setEmailError("");

    // Belt-and-suspenders: trigger browser download immediately
    triggerDownload(fileBlob, filename);

    try {
      const fileData = await blobToBase64(fileBlob);

      const res = await fetch("/api/budget-spreadsheet-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), filename, budgetTitle, fileData }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Email delivery failed.");
      }

      setScreen("sent");
    } catch (err) {
      // Download already fired — email failed, show error but don't block user
      setEmailError(
        err instanceof Error
          ? err.message
          : "Email delivery failed. Your file should still have downloaded above."
      );
    } finally {
      setEmailSubmitting(false);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────
  function handleReset() {
    setScreen("input");
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
  }

  // ─── Render ───────────────────────────────────────────────────

  // Input screen
  if (screen === "input") {
    return (
      <div className="bs-tool">
        <div style={{ marginBottom: "24px" }}>
          <textarea
            className="textarea bs-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this budget for? Add any categories, totals, or time period that matter to you. The more context, the better the result."
            rows={4}
          />
        </div>

        <div className="bs-upload-row">
          <UploadZone
            id="content-file"
            label="Your data or notes"
            sublabel="Upload a file with line items, goals, or existing numbers."
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
          className="btn btn-primary btn-lg btn-full"
          onClick={handleGenerate}
          disabled={!canSubmit}
          type="button"
          style={{ marginTop: "24px" }}
        >
          Generate My Spreadsheet
        </button>

        <p className="bs-footnote">
          Downloads as .xlsx — opens in Excel, Google Sheets, or Numbers.
        </p>
      </div>
    );
  }

  // Loading screen
  if (screen === "loading") {
    return (
      <div className="bs-tool">
        <div className="bs-loading">
          <div className="bs-loading-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="4" width="40" height="40" rx="6" fill="#1E7AB8" opacity="0.12" />
              <rect x="10" y="14" width="28" height="3" rx="1.5" fill="#1E7AB8" opacity="0.5" />
              <rect x="10" y="21" width="20" height="3" rx="1.5" fill="#1E7AB8" opacity="0.4" />
              <rect x="10" y="28" width="24" height="3" rx="1.5" fill="#1E7AB8" opacity="0.3" />
              <rect x="10" y="35" width="16" height="3" rx="1.5" fill="#1E7AB8" opacity="0.2" />
            </svg>
          </div>
          <h2 className="bs-loading-title">Building your spreadsheet...</h2>
          <p className="bs-loading-sub">
            Organizing line items, calculating formulas, and formatting your file.
            This takes about 15 seconds.
          </p>
          <div className="bs-loading-bar">
            <div className="bs-loading-bar-fill" />
          </div>
        </div>
      </div>
    );
  }

  // Ready screen — email gate
  if (screen === "ready") {
    const totalItems = budgetSections.reduce((sum, s) => sum + s.rowCount, 0);

    return (
      <div className="bs-tool">
        <div className="bs-ready">
          <div className="bs-ready-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="12" fill="#1E7AB8" opacity="0.1" />
              <path
                d="M18 28.5L24.5 35L38 21"
                stroke="#1E7AB8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="bs-ready-title">Your spreadsheet is ready.</h2>

          {budgetSections.length > 0 && (
            <div className="bs-sections-preview">
              <p className="bs-sections-label">
                Your {budgetTitle} includes {budgetSections.length} section{budgetSections.length !== 1 ? "s" : ""} and {totalItems} line item{totalItems !== 1 ? "s" : ""}:
              </p>
              <ul className="bs-sections-list">
                {budgetSections.map((s) => (
                  <li key={s.name} className="bs-sections-item">
                    <span className="bs-sections-dot" />
                    <span>{s.name}</span>
                    <span className="bs-sections-count">{s.rowCount} item{s.rowCount !== 1 ? "s" : ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form className="bs-email-form" onSubmit={handleEmailSubmit} noValidate>
            <label className="bs-email-label" htmlFor="budget-email">
              Where should we send it?
            </label>
            <div className="bs-email-row">
              <input
                id="budget-email"
                type="email"
                className="input bs-email-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={emailSubmitting}
              />
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={!canSendEmail || emailSubmitting}
              >
                {emailSubmitting ? "Sending..." : "Send My Spreadsheet"}
              </button>
            </div>
            {emailError && <p className="bs-email-error">{emailError}</p>}
          </form>

          <button
            className="bs-start-over"
            onClick={handleReset}
            type="button"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  // Sent screen
  if (screen === "sent") {
    return (
      <div className="bs-tool">
        <div className="bs-ready">
          <div className="bs-ready-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="12" fill="#1E7AB8" opacity="0.1" />
              <path d="M16 28l7 7L40 20" stroke="#1E7AB8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="bs-ready-title">Check your inbox.</h2>
          <p className="bs-ready-sub">
            We sent {budgetTitle} to {email}. It should arrive within a minute.
            Your file also downloaded automatically — check your Downloads folder if you don&apos;t see it.
          </p>
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={handleReset}
            type="button"
            style={{ marginTop: "8px" }}
          >
            Build Another Budget
          </button>
        </div>
      </div>
    );
  }

  // Error screen
  return (
    <div className="bs-tool">
      <div className="bs-error">
        <p className="bs-error-msg">{errorMsg}</p>
        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={handleReset}
          type="button"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
