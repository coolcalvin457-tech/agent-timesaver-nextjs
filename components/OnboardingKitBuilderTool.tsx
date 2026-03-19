"use client";

import { useState, useEffect, useRef } from "react";

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

type RoleType = "individual_contributor" | "manager";

interface Contact {
  name: string;
  title: string;
}

interface SavedFormData {
  hireName: string;
  hireTitle: string;
  department: string;
  startDate: string;
  managerName: string;
  roleType: RoleType | "";
  whyHired: string;
  weekOnePriorities: string;
  keyTools: string;
  howTeamWorks: string;
  thirtyToNinety: string;
  contacts: Contact[];
  teamNotes: string;
  feedbackCadence: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXTS = [".txt", ".pdf", ".docx", ".md"];
const OKB_STORAGE_KEY = "okb_form_data";
const LOADING_STEPS = [
  "Welcome letter",
  "First-week schedule",
  "Key contacts",
  "Role expectations (30/60/90)",
  "New hire checklist",
];

// ─── Storage helpers ────────────────────────────────────────────────────────────

function saveToStorage(data: SavedFormData): void {
  try {
    sessionStorage.setItem(OKB_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — continue without saving
  }
}

function loadFromStorage(): SavedFormData | null {
  try {
    const raw = sessionStorage.getItem(OKB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedFormData;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearStorage(): void {
  try {
    sessionStorage.removeItem(OKB_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(blob);
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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
        marginBottom: "24px",
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

// Quality signal — only appears as positive reinforcement at 150+ chars
function QualitySignal({ value }: { value: string }) {
  if (value.trim().length >= 150) {
    return (
      <p
        style={{
          margin: "6px 0 0",
          fontSize: "0.8125rem",
          color: "var(--success, #1A7A4A)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        ✓ Good detail. The kit will reflect this.
      </p>
    );
  }
  return null;
}

// Simple file upload zone (single file, context doc)
function ContextFileUpload({
  file,
  error,
  onFile,
  onError,
}: {
  file: File | null;
  error: string;
  onFile: (f: File | null) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      onError("File is too large. Maximum size is 10 MB.");
      onFile(null);
      return;
    }
    const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "");
    if (!ACCEPTED_EXTS.includes(ext)) {
      onError("Unsupported file type. Accepted: .txt, .pdf, .docx");
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
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--text-secondary, #555553)",
          marginBottom: "6px",
        }}
      >
        Job description or existing onboarding doc{" "}
        <span style={{ fontWeight: 400, color: "var(--text-muted, #888886)" }}>(optional)</span>
      </label>
      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-muted, #888886)",
          margin: "0 0 10px",
        }}
      >
        Upload a .txt, .pdf, or .docx and the AI will use it as additional context.
      </p>

      <input
        ref={inputRef}
        type="file"
        id="context-file"
        accept=".txt,.pdf,.docx,.md"
        onChange={handleChange}
        style={{ display: "none" }}
      />

      {file ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            background: "var(--bg-alt, #F8F8F6)",
            border: "1px solid var(--border, #E4E4E2)",
            borderRadius: "8px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--cta, #1E7AB8)" }}>
            <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="none"/>
            <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: "0.875rem", color: "var(--text-primary, #161618)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.name}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted, #888886)", fontSize: "1rem", lineHeight: 1, padding: "0 2px" }}
            aria-label="Remove file"
          >
            ×
          </button>
        </div>
      ) : (
        <label
          htmlFor="context-file"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            background: "var(--bg-alt, #F8F8F6)",
            border: "1px dashed var(--border, #E4E4E2)",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "border-color 0.15s ease",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: "var(--text-muted, #888886)" }}>
            <path d="M10 13V7M8 9l2-2 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="2.5" y="2.5" width="15" height="15" rx="3.5" stroke="currentColor" strokeWidth="1.4" fill="none"/>
          </svg>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted, #888886)" }}>
            Click to upload a reference document
          </span>
        </label>
      )}

      {error && (
        <p style={{ margin: "6px 0 0", fontSize: "0.8125rem", color: "#C0392B" }}>{error}</p>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function OnboardingKitBuilderTool({
  initialPaymentStatus,
  initialSessionId,
}: {
  initialPaymentStatus?: string;
  initialSessionId?: string;
}) {
  // ── Screen ──────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("s1");

  // ── Screen 1: The Hire ─────────────────────────────────────
  const [hireName, setHireName] = useState("");
  const [hireTitle, setHireTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [managerName, setManagerName] = useState("");
  const [roleType, setRoleType] = useState<RoleType | "">("");

  // ── Screen 2: The Role ─────────────────────────────────────
  const [whyHired, setWhyHired] = useState("");
  const [weekOnePriorities, setWeekOnePriorities] = useState("");
  const [keyTools, setKeyTools] = useState("");
  const [contextFile, setContextFile] = useState<File | null>(null);
  const [contextFileError, setContextFileError] = useState("");

  // ── Screen 3: Team & 90 Days ───────────────────────────────
  const [howTeamWorks, setHowTeamWorks] = useState("");
  const [thirtyToNinety, setThirtyToNinety] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([
    { name: "", title: "" },
    { name: "", title: "" },
    { name: "", title: "" },
  ]);
  const [teamNotes, setTeamNotes] = useState("");
  const [feedbackCadence, setFeedbackCadence] = useState("");

  // ── Generation state ──────────────────────────────────────
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [filename, setFilename] = useState("onboarding-kit.docx");
  const [loadingStep, setLoadingStep] = useState(0);

  // ── Email gate state ──────────────────────────────────────
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ── Paywall / checkout state ──────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // ── Returning purchaser state ─────────────────────────────
  const [showReturningCheck, setShowReturningCheck] = useState(false);
  const [returningEmail, setReturningEmail] = useState("");
  const [returningCheckLoading, setReturningCheckLoading] = useState(false);
  const [returningCheckError, setReturningCheckError] = useState("");
  const [paymentCancelled, setPaymentCancelled] = useState(false);

  // ── Error / validation state ──────────────────────────────
  const [errorMsg, setErrorMsg] = useState("");
  const [s1Error, setS1Error] = useState("");
  const [s2Error, setS2Error] = useState("");
  const [s3Error, setS3Error] = useState("");

  // ── Restore state from saved form data ────────────────────
  function restoreFromSaved(saved: SavedFormData) {
    setHireName(saved.hireName ?? "");
    setHireTitle(saved.hireTitle ?? "");
    setDepartment(saved.department ?? "");
    setStartDate(saved.startDate ?? "");
    setManagerName(saved.managerName ?? "");
    setRoleType(saved.roleType ?? "");
    setWhyHired(saved.whyHired ?? "");
    setWeekOnePriorities(saved.weekOnePriorities ?? "");
    setKeyTools(saved.keyTools ?? "");
    setHowTeamWorks(saved.howTeamWorks ?? "");
    setThirtyToNinety(saved.thirtyToNinety ?? "");
    setContacts(
      saved.contacts?.length
        ? saved.contacts
        : [{ name: "", title: "" }, { name: "", title: "" }, { name: "", title: "" }]
    );
    setTeamNotes(saved.teamNotes ?? "");
    setFeedbackCadence(saved.feedbackCadence ?? "");
  }

  // ── Loading animation ─────────────────────────────────────
  useEffect(() => {
    if (screen !== "loading") return;
    setLoadingStep(0);
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 5500)
    );
    return () => timers.forEach(clearTimeout);
  }, [screen]);

  // ── Payment detection on mount ────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialPaymentStatus) return;

    const saved = loadFromStorage();

    // User cancelled at Stripe — restore inputs and show paywall
    if (initialPaymentStatus === "cancelled") {
      if (saved) restoreFromSaved(saved);
      clearStorage();
      setPaymentCancelled(true);
      setScreen("paywall");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Payment succeeded — verify and build
    if (initialPaymentStatus === "success" && initialSessionId) {
      if (!saved) {
        // Edge case: sessionStorage was cleared (e.g. different browser/tab)
        setErrorMsg(
          "Your payment was successful, but we couldn't recover your form data. Please contact us at results@promptaiagents.com and we'll sort it out."
        );
        setScreen("error");
        return;
      }

      restoreFromSaved(saved);
      setScreen("verifying");
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Verify with Stripe, then build
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

  // ── Validation ────────────────────────────────────────────

  function validateS1(): boolean {
    if (!hireName.trim() || !hireTitle.trim() || !startDate.trim() || !managerName.trim()) {
      setS1Error("Please fill in all required fields.");
      return false;
    }
    if (!roleType) {
      setS1Error("Please select a role type before continuing.");
      return false;
    }
    setS1Error("");
    return true;
  }

  function validateS2(): boolean {
    if (whyHired.trim().length < 50) {
      setS2Error("Add a bit more detail about why this hire was made. It helps us write a better kit.");
      return false;
    }
    setS2Error("");
    return true;
  }

  function validateS3(): boolean {
    if (!howTeamWorks.trim()) {
      setS3Error("Please describe how the team works.");
      return false;
    }
    if (thirtyToNinety.trim().length < 50) {
      setS3Error("Add a bit more detail about the 30/60/90 expectations. It shapes the entire kit.");
      return false;
    }
    setS3Error("");
    return true;
  }

  // ── Navigation ────────────────────────────────────────────

  function goToS2() {
    if (!validateS1()) return;
    setScreen("s2");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToS3() {
    if (!validateS2()) return;
    setScreen("s3");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBackToS1() {
    setS1Error("");
    setScreen("s1");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBackToS2() {
    setS2Error("");
    setScreen("s2");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToPaywall() {
    if (!validateS3()) return;
    setPaymentCancelled(false);
    setCheckoutError("");
    setScreen("paywall");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Update a contact row ──────────────────────────────────

  function updateContact(index: number, field: "name" | "title", value: string) {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  // ── Core build logic (takes explicit data, not state) ─────

  async function buildFromData(data: SavedFormData, file?: File | null) {
    setScreen("loading");
    setErrorMsg("");
    // Ensure loading screen shows correct name
    setHireName(data.hireName);

    try {
      const form = new FormData();
      form.append("hireName",          data.hireName.trim());
      form.append("hireTitle",         data.hireTitle.trim());
      form.append("department",        data.department.trim());
      form.append("startDate",         data.startDate.trim());
      form.append("managerName",       data.managerName.trim());
      form.append("roleType",          data.roleType);
      form.append("whyHired",          data.whyHired.trim());
      form.append("weekOnePriorities", data.weekOnePriorities.trim());
      form.append("keyTools",          data.keyTools.trim());
      form.append("howTeamWorks",      data.howTeamWorks.trim());
      form.append("thirtyToNinety",    data.thirtyToNinety.trim());
      form.append("keyContacts",       JSON.stringify(data.contacts));
      form.append("teamNotes",         data.teamNotes.trim());
      form.append("feedbackCadence",   data.feedbackCadence.trim());
      if (file) form.append("contextFile", file);

      const res = await fetch("/api/onboarding-kit", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(
          (d as { error?: string }).error ??
            "Something went wrong while building the kit. Your inputs are still here. Try again and it should work."
        );
      }

      const blob = await res.blob();
      const rawFilename = res.headers.get("X-Kit-Filename");

      setFileBlob(blob);
      setFilename(rawFilename ? decodeURIComponent(rawFilename) : "onboarding-kit.docx");
      setScreen("email-gate");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong while building the kit. Your inputs are still here. Try again and it should work."
      );
      setScreen("error");
    }
  }

  // ── Build from current state (called from retry / error screen) ───

  async function handleBuild() {
    if (!validateS3()) return;
    await buildFromData(
      {
        hireName, hireTitle, department, startDate, managerName, roleType,
        whyHired, weekOnePriorities, keyTools, howTeamWorks, thirtyToNinety,
        contacts, teamNotes, feedbackCadence,
      },
      contextFile
    );
  }

  // ── Checkout: save inputs, redirect to Stripe ─────────────

  async function handleCheckout() {
    setCheckoutLoading(true);
    setCheckoutError("");

    // Persist form data so it survives the Stripe redirect
    saveToStorage({
      hireName, hireTitle, department, startDate, managerName, roleType,
      whyHired, weekOnePriorities, keyTools, howTeamWorks, thirtyToNinety,
      contacts, teamNotes, feedbackCadence,
    });

    try {
      const res = await fetch("/api/hr-package-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successPath: "onboarding-kit-builder",
          cancelPath: "onboarding-kit-builder",
        }),
      });
      if (!res.ok) throw new Error("Failed to create checkout session.");
      const { url } = await res.json() as { url?: string };
      if (!url) throw new Error("No checkout URL returned.");
      window.location.href = url;
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setCheckoutLoading(false);
    }
  }

  // ── Returning purchaser check ─────────────────────────────

  async function handleReturningEmailCheck() {
    if (!returningEmail.trim()) return;
    setReturningCheckLoading(true);
    setReturningCheckError("");

    try {
      const res = await fetch("/api/verify-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: returningEmail.trim() }),
      });
      const { verified } = await res.json() as { verified: boolean };

      if (verified) {
        // Active subscription confirmed — skip Stripe, build directly
        const saved = loadFromStorage();
        await buildFromData(
          saved ?? {
            hireName, hireTitle, department, startDate, managerName, roleType,
            whyHired, weekOnePriorities, keyTools, howTeamWorks, thirtyToNinety,
            contacts, teamNotes, feedbackCadence,
          }
        );
      } else {
        setReturningCheckError("No active subscription found for that email. Purchase below.");
      }
    } catch {
      setReturningCheckError("Something went wrong. Please try again.");
    } finally {
      setReturningCheckLoading(false);
    }
  }

  // ── Email submit: download + send simultaneously ──────────

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@") || !fileBlob || emailSubmitting) return;

    setEmailSubmitting(true);
    setEmailError("");

    // Browser download fires immediately
    triggerDownload(fileBlob, filename);

    try {
      const fileData = await blobToBase64(fileBlob);

      const res = await fetch("/api/onboarding-kit-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          filename,
          hireName: hireName.trim(),
          hireTitle: hireTitle.trim(),
          fileData,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Email delivery failed.");
      }

      setScreen("sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // Download already fired — show soft error, don't block user
      setEmailError(
        err instanceof Error
          ? err.message
          : "Email delivery failed. Your file should still have downloaded."
      );
    } finally {
      setEmailSubmitting(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────

  function handleReset() {
    setScreen("s1");
    setHireName(""); setHireTitle(""); setDepartment(""); setStartDate("");
    setManagerName(""); setRoleType("");
    setWhyHired(""); setWeekOnePriorities(""); setKeyTools("");
    setContextFile(null); setContextFileError("");
    setHowTeamWorks(""); setThirtyToNinety("");
    setContacts([{ name: "", title: "" }, { name: "", title: "" }, { name: "", title: "" }]);
    setTeamNotes(""); setFeedbackCadence("");
    setFileBlob(null); setFilename("onboarding-kit.docx");
    setEmail(""); setEmailError(""); setEmailSubmitting(false);
    setErrorMsg(""); setS1Error(""); setS2Error(""); setS3Error("");
    setCheckoutLoading(false); setCheckoutError(""); setPaymentCancelled(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Retry (from error screen) ──────────────────────────────

  async function handleRetry() {
    await handleBuild();
  }

  // ─── Shared input styles ────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    fontSize: "0.9375rem",
    border: "1px solid var(--border, #E4E4E2)",
    borderRadius: "8px",
    background: "var(--surface, #FFFFFF)",
    color: "var(--text-primary, #161618)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical",
    lineHeight: 1.6,
    minHeight: "100px",
  };

  const fieldWrapStyle: React.CSSProperties = {
    marginBottom: "24px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-secondary, #555553)",
    marginBottom: "6px",
  };

  const helperStyle: React.CSSProperties = {
    fontSize: "0.8125rem",
    color: "var(--text-muted, #888886)",
    margin: "5px 0 0",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "0.8125rem",
    color: "#C0392B",
    margin: "6px 0 0",
  };

  // ─── Renders ────────────────────────────────────────────────────────────────

  // ── Screen 1: The Hire ──────────────────────────────────────
  if (screen === "s1") {
    return (
      <div className="okb-tool">
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Tell us about your new hire.
          </h2>
        </div>

        {/* Name + Title row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>First name</label>
            <input
              type="text"
              style={inputStyle}
              value={hireName}
              onChange={(e) => setHireName(e.target.value)}
              placeholder="e.g. Jordan"
            />
          </div>
          <div>
            <label style={labelStyle}>Job title</label>
            <input
              type="text"
              style={inputStyle}
              value={hireTitle}
              onChange={(e) => setHireTitle(e.target.value)}
              placeholder="e.g. Marketing Manager"
            />
          </div>
        </div>

        {/* Department + Start Date row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Department</label>
            <input
              type="text"
              style={inputStyle}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Marketing"
            />
          </div>
          <div>
            <label style={labelStyle}>Start date</label>
            <input
              type="text"
              style={inputStyle}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="e.g. April 7"
            />
          </div>
        </div>

        {/* Hiring manager */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Hiring manager's name</label>
          <input
            type="text"
            style={inputStyle}
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="e.g. Sarah Chen"
          />
        </div>

        {/* Role type toggle */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Role type <span style={{ fontWeight: 400, color: "var(--text-muted, #999)" }}>(Required)</span></label>
          <div style={{ display: "flex", gap: "10px" }}>
            {(
              [
                { value: "individual_contributor", label: "Individual contributor" },
                { value: "manager", label: "Manager or team lead" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRoleType(opt.value)}
                style={{
                  padding: "9px 16px",
                  fontSize: "0.875rem",
                  fontWeight: roleType === opt.value ? 600 : 400,
                  border: `1px solid ${roleType === opt.value ? "var(--cta, #1E7AB8)" : "var(--border, #E4E4E2)"}`,
                  borderRadius: "8px",
                  background: roleType === opt.value ? "rgba(30,122,184,0.07)" : "transparent",
                  color: roleType === opt.value ? "var(--cta, #1E7AB8)" : "var(--text-secondary, #555553)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {s1Error && <p style={{ ...errorStyle, marginBottom: "12px" }}>{s1Error}</p>}

        <button
          type="button"
          className="btn btn-primary btn-lg btn-full"
          onClick={goToS2}
          style={{ marginTop: "12px" }}
        >
          Continue
        </button>
      </div>
    );
  }

  // ── Screen 2: The Role ──────────────────────────────────────
  if (screen === "s2") {
    return (
      <div className="okb-tool">
        <BackButton onClick={goBackToS1} />

        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
            Why was {hireName || "they"} hired?
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            These are the questions most onboarding programs skip. Your answers go directly into their kit.
          </p>
        </div>

        {/* Why this hire */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Why this hire, why now</label>
          <textarea
            style={{ ...textareaStyle, minHeight: "120px" }}
            value={whyHired}
            onChange={(e) => setWhyHired(e.target.value)}
            placeholder={`e.g. We're scaling our outbound motion and ${hireName || "Jordan"} was hired to build the top-of-funnel function from scratch. This role didn't exist before. They're creating the playbook.`}
          />
          <QualitySignal value={whyHired} />
        </div>

        {/* Week one priorities */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Week one priorities</label>
          <textarea
            style={{ ...textareaStyle, minHeight: "100px" }}
            value={weekOnePriorities}
            onChange={(e) => setWeekOnePriorities(e.target.value)}
            placeholder={`e.g. Meet the full sales team, get access to HubSpot, shadow two customer calls, understand how deals move through the pipeline.`}
          />
        </div>

        {/* Key tools */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Key tools and systems</label>
          <input
            type="text"
            style={inputStyle}
            value={keyTools}
            onChange={(e) => setKeyTools(e.target.value)}
            placeholder="e.g. HubSpot, Slack, Notion, Zoom, Google Drive"
          />
        </div>

        {/* Optional file upload */}
        <div style={{ ...fieldWrapStyle, marginTop: "8px" }}>
          <ContextFileUpload
            file={contextFile}
            error={contextFileError}
            onFile={setContextFile}
            onError={setContextFileError}
          />
        </div>

        {s2Error && <p style={{ ...errorStyle, marginBottom: "12px" }}>{s2Error}</p>}

        <button
          type="button"
          className="btn btn-primary btn-lg btn-full"
          onClick={goToS3}
          style={{ marginTop: "8px" }}
        >
          Continue
        </button>
      </div>
    );
  }

  // ── Screen 3: Team & First 90 Days ─────────────────────────
  if (screen === "s3") {
    return (
      <div className="okb-tool">
        <BackButton onClick={goBackToS2} />

        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
            What does success look like for {hireName || "them"}?
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            And how does your team actually work? Not the org chart version. The real one.
          </p>
        </div>

        {/* How the team works */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>How the team works</label>
          <textarea
            style={{ ...textareaStyle, minHeight: "100px" }}
            value={howTeamWorks}
            onChange={(e) => setHowTeamWorks(e.target.value)}
            placeholder="e.g. Small team, moves fast. Slack is primary. Email is rare. Decisions go through the manager but everyone's input is expected. Weekly standup Mondays at 9."
          />
        </div>

        {/* 30/60/90 */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>30/60/90 day expectations</label>
          <textarea
            style={{ ...textareaStyle, minHeight: "120px" }}
            value={thirtyToNinety}
            onChange={(e) => setThirtyToNinety(e.target.value)}
            placeholder="e.g. 30 days: understands all key accounts and has first prospecting list built. 60 days: first outbound sequence live. 90 days: pipeline contribution visible in HubSpot."
          />
          <p style={helperStyle}>Write in plain language. You don't need three separate fields. Just describe all three milestones in one response.</p>
          <QualitySignal value={thirtyToNinety} />
        </div>

        {/* Key contacts */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>
            Key contacts{" "}
            <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <p style={{ ...helperStyle, marginTop: 0, marginBottom: "10px" }}>
            Name the 2–3 people your new hire should know first.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            {contacts.map((contact, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="text"
                  style={{ ...inputStyle, fontSize: "0.875rem" }}
                  value={contact.name}
                  onChange={(e) => updateContact(i, "name", e.target.value)}
                  placeholder="Name"
                />
                <input
                  type="text"
                  style={{ ...inputStyle, fontSize: "0.875rem" }}
                  value={contact.title}
                  onChange={(e) => updateContact(i, "title", e.target.value)}
                  placeholder="Title / Role"
                />
              </div>
            ))}
          </div>

          {/* Free-form team notes */}
          <label style={{ ...labelStyle, fontWeight: 400, color: "var(--text-muted)" }}>
            Anything else about the team?
          </label>
          <textarea
            style={{ ...textareaStyle, minHeight: "72px", fontSize: "0.875rem" }}
            value={teamNotes}
            onChange={(e) => setTeamNotes(e.target.value)}
            placeholder="e.g. Sarah is the go-to for tool access, even though IT technically owns it."
          />
        </div>

        {/* Feedback cadence */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>
            Feedback cadence{" "}
            <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <input
            type="text"
            style={inputStyle}
            value={feedbackCadence}
            onChange={(e) => setFeedbackCadence(e.target.value)}
            placeholder="e.g. Weekly 1:1 with manager, 30-day check-in with HR."
          />
        </div>

        {s3Error && <p style={{ ...errorStyle, marginBottom: "12px" }}>{s3Error}</p>}

        <button
          type="button"
          className="btn btn-primary btn-lg btn-full"
          onClick={goToPaywall}
          style={{ marginTop: "8px" }}
        >
          Build My Kit
        </button>
      </div>
    );
  }

  // ── Paywall screen ───────────────────────────────────────────
  if (screen === "paywall") {
    return (
      <div className="okb-tool">

        {/* Payment cancelled banner */}
        {paymentCancelled && (
          <div
            style={{
              background: "rgba(30,122,184,0.06)",
              border: "1px solid rgba(30,122,184,0.2)",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "24px",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            Payment wasn't completed. Your progress is saved. Try again below.
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
            Your kit is ready to build.
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            Get access below to generate {hireName ? `${hireName}'s` : "the"} onboarding kit.
          </p>
        </div>

        {/* Kit contents preview */}
        <div
          style={{
            background: "var(--bg-alt, #F8F8F6)",
            border: "1px solid var(--border, #E4E4E2)",
            borderRadius: "10px",
            padding: "18px 20px",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Your kit includes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              "Warm Welcome Letter",
              "First-Week Schedule",
              "Key Contacts",
              "30-60-90 Day Plan",
              "New Hire Checklist",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--cta, #1E7AB8)", fontSize: "0.875rem", fontWeight: 700 }}>·</span>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bundle offer */}
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
              HR Tools Package
            </span>
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
                border: "1px solid rgba(30,122,184,0.35)",
              }}
            >
              Annual Subscription
            </span>
          </div>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "2rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>$99</span>
            <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>/year</span>
          </div>

          {/* Description */}
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: "0 0 20px" }}>
            Includes Onboarding Kit, PIP Builder, and every HR tool added to the package. One purchase, all tools.
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutLoading}
            style={{
              width: "100%",
              padding: "13px 20px",
              fontSize: "0.9375rem",
              fontWeight: 700,
              background: checkoutLoading ? "rgba(30,122,184,0.5)" : "#1E7AB8",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              cursor: checkoutLoading ? "not-allowed" : "pointer",
              transition: "background 0.15s ease",
              marginBottom: "12px",
            }}
          >
            {checkoutLoading ? "Preparing checkout..." : "Get Access · $99/year →"}
          </button>

          {checkoutError && (
            <p style={{ fontSize: "0.8125rem", color: "#F87171", margin: "0 0 8px" }}>
              {checkoutError}
            </p>
          )}

          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", margin: 0, textAlign: "center" }}>
            Annual subscription. Cancel anytime.
          </p>
        </div>

        {/* Returning purchaser */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          {!showReturningCheck ? (
            <button
              type="button"
              onClick={() => setShowReturningCheck(true)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.8125rem", cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              Already have access? Enter your email.
            </button>
          ) : (
            <div style={{ background: "var(--bg-alt, #F8F8F6)", border: "1px solid var(--border, #E4E4E2)", borderRadius: "8px", padding: "14px 16px", textAlign: "left" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Enter the email you purchased with:
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="email"
                  value={returningEmail}
                  onChange={(e) => setReturningEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleReturningEmailCheck();
                    }
                  }}
                  placeholder="your@email.com"
                  style={{
                    flex: 1, padding: "10px 12px", fontSize: "0.9375rem",
                    border: "1px solid var(--border, #E4E4E2)", borderRadius: "6px",
                    background: "var(--surface, #FFFFFF)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" as const,
                  }}
                />
                <button
                  type="button"
                  onClick={handleReturningEmailCheck}
                  disabled={returningCheckLoading || !returningEmail.trim()}
                  style={{
                    padding: "10px 16px", fontSize: "0.875rem", fontWeight: 600,
                    background: "var(--dark, #161618)", color: "#FFFFFF",
                    border: "none", borderRadius: "6px",
                    cursor: returningCheckLoading || !returningEmail.trim() ? "not-allowed" : "pointer",
                    opacity: returningCheckLoading || !returningEmail.trim() ? 0.5 : 1,
                    flexShrink: 0, whiteSpace: "nowrap" as const,
                  }}
                >
                  {returningCheckLoading ? "Checking..." : "Check access"}
                </button>
              </div>
              {returningCheckError && (
                <p style={{ fontSize: "0.8125rem", color: "#DC2626", marginTop: "8px" }}>{returningCheckError}</p>
              )}
            </div>
          )}
        </div>

        {/* Edit inputs link */}
        <button
          type="button"
          onClick={() => { setS3Error(""); setScreen("s3"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.875rem", cursor: "pointer", padding: 0, opacity: 0.7 }}
        >
          ← Edit my inputs
        </button>
      </div>
    );
  }

  // ── Verifying payment screen ─────────────────────────────────
  if (screen === "verifying") {
    return (
      <div className="okb-tool">
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div
            style={{
              display: "inline-block",
              width: "32px",
              height: "32px",
              border: "3px solid rgba(30,122,184,0.2)",
              borderTopColor: "#1E7AB8",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: "20px",
            }}
          />
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>
            Verifying your payment...
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
            Just a moment.
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Loading screen ──────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div className="okb-tool">
        <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
          {/* Animated icon */}
          <div style={{ marginBottom: "24px" }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ display: "inline-block" }}>
              <rect width="56" height="56" rx="12" fill="#1E7AB8" fillOpacity="0.1" />
              <rect x="12" y="17" width="32" height="3" rx="1.5" fill="#1E7AB8" fillOpacity="0.6" />
              <rect x="12" y="24" width="24" height="3" rx="1.5" fill="#1E7AB8" fillOpacity="0.45" />
              <rect x="12" y="31" width="28" height="3" rx="1.5" fill="#1E7AB8" fillOpacity="0.3" />
              <rect x="12" y="38" width="18" height="3" rx="1.5" fill="#1E7AB8" fillOpacity="0.2" />
            </svg>
          </div>

          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
            Building {hireName ? `${hireName}'s` : "the"} onboarding kit.
          </h2>
          <p className="loading-subline" style={{ marginTop: "8px", marginBottom: "32px" }}>
            About 25 seconds.
          </p>

          {/* Step-by-step progress */}
          <div
            style={{
              textAlign: "left",
              maxWidth: "300px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {LOADING_STEPS.map((step, i) => {
              const isDone = i < loadingStep;
              const isActive = i === loadingStep;
              return (
                <div
                  key={step}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    opacity: isDone || isActive ? 1 : 0.35,
                    transition: "opacity 0.4s ease",
                  }}
                >
                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      border: `1.5px solid ${isDone ? "var(--success, #1A7A4A)" : isActive ? "var(--cta, #1E7AB8)" : "var(--border, #E4E4E2)"}`,
                      background: isDone ? "var(--success, #1A7A4A)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "0.6875rem",
                      color: "#FFFFFF",
                      transition: "all 0.4s ease",
                    }}
                  >
                    {isDone ? "✓" : isActive ? (
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--cta, #1E7AB8)", display: "block" }} />
                    ) : null}
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: isDone ? "var(--text-secondary)" : isActive ? "var(--text-primary)" : "var(--text-muted)",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Email gate ──────────────────────────────────────────────
  if (screen === "email-gate") {
    return (
      <div className="okb-tool">
        {/* Success icon */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ display: "inline-block", marginBottom: "16px" }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="12" fill="#1E7AB8" fillOpacity="0.1" />
              <path d="M18 28.5L24.5 35L38 21" stroke="#1E7AB8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
            {hireName ? `${hireName}'s` : "The"} onboarding kit is ready.
          </h2>
          {hireTitle && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
              {hireTitle}
            </p>
          )}
        </div>

        {/* Kit contents preview */}
        <div
          style={{
            background: "var(--bg-alt, #F8F8F6)",
            border: "1px solid var(--border, #E4E4E2)",
            borderRadius: "10px",
            padding: "20px 22px",
            marginBottom: "24px",
          }}
        >
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Your kit includes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { title: "Warm Welcome Letter", desc: `A personalized note from ${managerName || "the hiring manager"} to ${hireName || "the new hire"}.` },
              { title: "First-Week Schedule", desc: `Day-by-day outline for ${hireName ? `${hireName}'s` : "their"} first five days.` },
              { title: "Key Contacts", desc: `The people ${hireName || "they"} need to know and why.` },
              { title: "30-60-90 Day Plan", desc: `What success looks like at 30, 60, and 90 days.` },
              { title: "New Hire Checklist", desc: `Pre-start through Month 1.` },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", gap: "10px" }}>
                <span style={{ color: "var(--cta, #1E7AB8)", fontWeight: 600, flexShrink: 0, marginTop: "1px" }}>·</span>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} noValidate>
          <label
            htmlFor="okb-email"
            style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}
          >
            Where should we send it?
          </label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              id="okb-email"
              type="email"
              className="input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={emailSubmitting}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!email.trim() || !email.includes("@") || emailSubmitting}
            >
              {emailSubmitting ? "Sending..." : "Send My Kit"}
            </button>
          </div>
          {emailError && <p style={{ ...errorStyle, marginBottom: "8px" }}>{emailError}</p>}
        </form>

        {/* Tip line */}
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5, margin: "12px 0 0", padding: "12px 14px", background: "rgba(30,122,184,0.05)", borderRadius: "8px", borderLeft: "3px solid rgba(30,122,184,0.3)" }}>
          <strong style={{ color: "var(--text-secondary)" }}>Tip:</strong> Personalize the welcome letter signature before sharing. It takes 30 seconds and makes it feel like it came from the hiring manager directly.
        </p>

        <button
          type="button"
          onClick={handleReset}
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.875rem", cursor: "pointer", marginTop: "20px", padding: 0, textDecoration: "underline" }}
        >
          Start over
        </button>
      </div>
    );
  }

  // ── Sent screen ─────────────────────────────────────────────
  if (screen === "sent") {
    return (
      <div className="okb-tool">
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ display: "inline-block", marginBottom: "20px" }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="12" fill="#1A7A4A" fillOpacity="0.1" />
              <path d="M16 28l7 7L40 20" stroke="#1A7A4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
            Emailed and downloaded.
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", margin: "0 0 32px", lineHeight: 1.6 }}>
            Check your downloads folder. Open the .docx, make any edits you want, and it's ready to share before Day 1.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg btn-full"
            onClick={handleReset}
          >
            Build another kit
          </button>
        </div>

        {/* Bundle callout */}
        <div style={{ marginTop: "32px", padding: "20px 22px", background: "var(--bg-alt, #F8F8F6)", border: "1px solid var(--border, #E4E4E2)", borderRadius: "10px" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--cta)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Part of the HR Tools Package
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>
            Your subscription also includes AGENT: PIP Builder. Structured, defensible Performance Improvement Plans as a ready-to-use .docx file.
          </p>
          <a
            href="/pip-builder"
            style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--cta)", textDecoration: "none" }}
          >
            Try PIP Builder →
          </a>
        </div>
      </div>
    );
  }

  // ── Error screen ─────────────────────────────────────────────
  return (
    <div className="okb-tool">
      <div style={{ padding: "8px 0" }}>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.6 }}>
          {errorMsg || "Something went wrong while building the kit. Your inputs are still here. Try again and it should work."}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-lg btn-full"
          onClick={handleRetry}
          style={{ marginBottom: "12px" }}
        >
          Try again
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.875rem", cursor: "pointer", padding: 0, textDecoration: "underline", display: "block" }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
