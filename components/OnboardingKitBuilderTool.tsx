"use client";

import { useState, useEffect, useRef } from "react";
import ToolLoadingScreen from "@/components/shared/ToolLoadingScreen";
import BackButton from "@/components/shared/BackButton";
import StepIndicator from "@/components/shared/StepIndicator";
import QualitySignal from "@/components/shared/QualitySignal";
import CrossSellBlock from "@/components/shared/CrossSellBlock";
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

type RoleType = "individual_contributor" | "manager";

interface Contact {
  name: string;
  title: string;
  email: string;
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
  "Welcome Letter",
  "First-Week Schedule",
  "Key Contacts",
  "30-60-90 Day Plan",
  "New Hire Checklist",
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

// ─── Sub-components ────────────────────────────────────────────────────────────

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
  const { user } = useAuth();
  // ── Tool container ref (for scroll-to-tool on screen changes) ─
  const toolContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // ── Screen ──────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("paywall");

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
    { name: "", title: "", email: "" },
    { name: "", title: "", email: "" },
    { name: "", title: "", email: "" },
  ]);
  const [teamNotes, setTeamNotes] = useState("");
  const [feedbackCadence, setFeedbackCadence] = useState("");

  // ── Generation state ──────────────────────────────────────
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [filename, setFilename] = useState("onboarding-kit.docx");
  const [loadingStep, setLoadingStep] = useState(0);

  // ── Email (auto-send after build) ─────────────────────────
  const [email, setEmail] = useState("");

  // ── Paywall / checkout state ──────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paywallEmail, setPaywallEmail] = useState("");
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [subscriptionVerified, setSubscriptionVerified] = useState(false);
  const [subCheckLoading, setSubCheckLoading] = useState(false);

  // ── Returning purchaser state (kept for legacy Stripe return flow) ────────
  const [showReturningCheck, setShowReturningCheck] = useState(false);
  const [returningEmail, setReturningEmail] = useState("");
  const [returningCheckLoading, setReturningCheckLoading] = useState(false);
  const [returningCheckError, setReturningCheckError] = useState("");

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
        : [{ name: "", title: "", email: "" }, { name: "", title: "", email: "" }, { name: "", title: "", email: "" }]
    );
    setTeamNotes(saved.teamNotes ?? "");
    setFeedbackCadence(saved.feedbackCadence ?? "");
  }

  // ── Loading animation ─────────────────────────────────────
  useEffect(() => {
    if (screen !== "loading") return;
    setLoadingStep(0);
    const stepDelays = [0, 25000, 55000, 95000, 130000]; // ~25s intervals across 3-minute build
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), stepDelays[i])
    );
    return () => timers.forEach(clearTimeout);
  }, [screen]);

  // ── Auth: pre-fill email fields when logged in ──────────
  // INTENTIONAL: paid tools pre-fill but do NOT auto-skip the email gate.
  // Paid tools produce file downloads that need explicit user action.
  // Free tools auto-skip instead. See paid-tools-copy-spec.md "Auth Skip Behavior".
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
    fetch("/api/verify-subscription", {
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

  // ── Scroll to tool container on screen change (skip initial render) ───────
  // S139: also skip scroll when auto-advancing from paywall to s1 (subscriber
  // auto-check). User should land at page top, not be scrolled to the tool.
  const prevScreenRef = useRef<string>(screen);
  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = screen;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (prev === "paywall" && screen === "s1") return;
    toolContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [screen]);

  // ── Payment detection on mount ────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialPaymentStatus) return;

    // User cancelled at Stripe
    if (initialPaymentStatus === "cancelled") {
      clearStorage();
      setPaymentCancelled(true);
      setScreen("paywall");
      return;
    }

    // Payment succeeded — verify and go to s1
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

  // ── After sign-in redirect, user lands on paywall (initial screen).
  // The auto-check subscription effect above handles verification.

  // ── Validation ────────────────────────────────────────────

  function validateS1(): boolean {
    if (!hireName.trim() || !hireTitle.trim() || !startDate.trim() || !managerName.trim()) {
      setS1Error("We need the hire's name, job title, start date, and manager name to personalize the kit.");
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
  }

  function goToS3() {
    if (!validateS2()) return;
    setScreen("s3");
  }

  function goBackToS1() {
    setS1Error("");
    setScreen("s1");
  }

  function goBackToS2() {
    setS2Error("");
    setScreen("s2");
  }

  function goToBuild() {
    if (!validateS3()) return;
    handleBuild();
  }

  // ── Update a contact row ──────────────────────────────────

  function updateContact(index: number, field: "name" | "title" | "email", value: string) {
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
      const kitFilename = rawFilename ? decodeURIComponent(rawFilename) : "onboarding-kit.docx";

      setFileBlob(blob);
      setFilename(kitFilename);

      // Auto-deliver: download file + send email in background
      triggerDownload(blob, kitFilename);
      if (email) {
        blobToBase64(blob).then((fileData) => {
          fetch("/api/onboarding-kit-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              filename: kitFilename,
              hireName: data.hireName.trim(),
              hireTitle: data.hireTitle.trim(),
              fileData,
            }),
          }).catch(() => {});
        }).catch(() => {});
      }

      setScreen("sent");
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

  // ── Get Access: check subscription first, then Stripe if needed ──────────

  async function handleGetAccess() {
    if (!paywallEmail.trim()) {
      setCheckoutError("Enter your email to continue.");
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError("");

    // First: check if they already have an active subscription
    try {
      const subRes = await fetch("/api/verify-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: paywallEmail.trim() }),
      });
      const { verified } = await subRes.json() as { verified: boolean };

      if (verified) {
        setEmail(paywallEmail.trim());
        setSubscriptionVerified(true);
        setCheckoutLoading(false);
        setScreen("s1");
        return;
      }
    } catch {
      // If subscription check fails, proceed to Stripe anyway
    }

    // No active subscription — redirect to Stripe
    try {
      const res = await fetch("/api/hr-package-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successPath: "onboarding",
          cancelPath: "onboarding",
          customerEmail: paywallEmail.trim(),
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

  // ── Legacy returning purchaser check (kept for returning users who click old link) ──

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
        setEmail(returningEmail.trim());
        setSubscriptionVerified(true);
        setScreen("s1");
      } else {
        setReturningCheckError("No active subscription found for that email. Purchase below.");
      }
    } catch {
      setReturningCheckError("Something went wrong. Please try again.");
    } finally {
      setReturningCheckLoading(false);
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
    setContacts([{ name: "", title: "", email: "" }, { name: "", title: "", email: "" }, { name: "", title: "", email: "" }]);
    setTeamNotes(""); setFeedbackCadence("");
    setFileBlob(null); setFilename("onboarding-kit.docx");
    setEmail("");
    setErrorMsg(""); setS1Error(""); setS2Error(""); setS3Error("");
    setCheckoutLoading(false); setCheckoutError(""); setPaywallEmail(""); setPaymentCancelled(false);
    setShowReturningCheck(false); setReturningEmail(""); setReturningCheckError("");
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
    marginBottom: "20px",
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
      <div ref={toolContainerRef} className="okb-tool">
        <StepIndicator current={1} total={3} />
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.25vw, 2rem)", fontWeight: 400, fontFamily: "var(--font-display)", lineHeight: 1.25, color: "var(--text-primary)", margin: 0 }}>
            Tell us about your new hire.
          </h2>
        </div>

        {/* Name + Title row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
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
                onClick={() => {
                  setRoleType(opt.value);
                  if (hireName.trim() && hireTitle.trim() && startDate.trim() && managerName.trim()) {
                    setTimeout(() => goToS2(), 180);
                  }
                }}
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
          style={{ marginTop: "8px" }}
        >
          Continue
        </button>
      </div>
    );
  }

  // ── Screen 2: The Role ──────────────────────────────────────
  if (screen === "s2") {
    return (
      <div ref={toolContainerRef} className="okb-tool">
        <BackButton onClick={goBackToS1} />
        <StepIndicator current={2} total={3} />

        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.25vw, 2rem)", fontWeight: 400, fontFamily: "var(--font-display)", lineHeight: 1.25, color: "var(--text-primary)", margin: 0 }}>
            Why was {hireName || "they"} hired?
          </h2>
        </div>

        {/* Why this hire */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Why this hire, why now</label>
          <textarea
            style={{ ...textareaStyle, minHeight: "120px" }}
            value={whyHired}
            onChange={(e) => setWhyHired(e.target.value)}
            placeholder={`e.g. We're scaling our outbound motion and ${hireName || "Jordan"} was hired to build the top-of-funnel function from scratch. This role didn't exist before. They're creating the playbook.`}
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {whyHired.length}/500
          </div>
          <QualitySignal value={whyHired} message="Good detail. The kit will reflect this." />
        </div>

        {/* Week one priorities */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Week one priorities</label>
          <textarea
            style={{ ...textareaStyle, minHeight: "100px" }}
            value={weekOnePriorities}
            onChange={(e) => setWeekOnePriorities(e.target.value)}
            placeholder={`e.g. Meet the full sales team, get access to HubSpot, shadow two customer calls, understand how deals move through the pipeline.`}
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {weekOnePriorities.length}/500
          </div>
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
      <div ref={toolContainerRef} className="okb-tool">
        <BackButton onClick={goBackToS2} />
        <StepIndicator current={3} total={3} />

        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.25vw, 2rem)", fontWeight: 400, fontFamily: "var(--font-display)", lineHeight: 1.25, color: "var(--text-primary)", margin: 0 }}>
            What does success look like for {hireName || "them"}?
          </h2>
        </div>

        {/* How the team works */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>How the team works</label>
          <textarea
            style={{ ...textareaStyle, minHeight: "100px" }}
            value={howTeamWorks}
            onChange={(e) => setHowTeamWorks(e.target.value)}
            placeholder="e.g. Small team, moves fast. Slack is primary. Email is rare. Decisions go through the manager but everyone's input is expected. Weekly standup Mondays at 9."
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {howTeamWorks.length}/500
          </div>
        </div>

        {/* 30/60/90 */}
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>30/60/90 day expectations</label>
          <textarea
            style={{ ...textareaStyle, minHeight: "120px" }}
            value={thirtyToNinety}
            onChange={(e) => setThirtyToNinety(e.target.value)}
            placeholder="e.g. 30 days: understands all key accounts and has first prospecting list built. 60 days: first outbound sequence live. 90 days: pipeline contribution visible in HubSpot."
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {thirtyToNinety.length}/500
          </div>
          <p style={helperStyle}>Write in plain language. You don't need three separate fields. Just describe all three milestones in one response.</p>
          <QualitySignal value={thirtyToNinety} message="Good detail. The kit will reflect this." />
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
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
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
                <input
                  type="email"
                  style={{ ...inputStyle, fontSize: "0.875rem" }}
                  value={contact.email}
                  onChange={(e) => updateContact(i, "email", e.target.value)}
                  placeholder="Email"
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
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {teamNotes.length}/500
          </div>
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
          onClick={goToBuild}
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
      <div ref={toolContainerRef} className="okb-tool">

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
            Payment wasn&apos;t completed. No charge was made. Try again below.
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.25vw, 2rem)", fontWeight: 400, fontFamily: "var(--font-display)", lineHeight: 1.25, color: "var(--text-primary)", margin: 0 }}>
            Onboarding Kit for Every New Hire.
          </h2>
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
            Includes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              "Welcome Letter",
              "First-Week Schedule",
              "Key Contacts",
              "30-60-90 Day Plan",
              "New Hire Checklist",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: "var(--cta, #1E7AB8)" }}>
                  <path d="M2.5 1.5h6l3 3v8h-9v-11z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
                  <path d="M8.5 1.5v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Subscription active: skip payment, show Build button ── */}
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
                HR Agents Package
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
              Your subscription is active. Build as many kits as you need.
            </p>

            <button
              type="button"
              onClick={() => {
                setEmail(paywallEmail.trim());
                setScreen("s1");
              }}
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
          <>
            {/* ── Bundle offer (non-subscriber) ── */}
            <div
              style={{
                background: "var(--dark, #161618)",
                borderRadius: "12px",
                padding: "24px 26px",
                marginBottom: "8px",
              }}
            >
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#FFFFFF" }}>
                  HR Agents Package
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
                    border: "1px solid rgba(30,122,184,0.20)",
                  }}
                >
                  Annual Subscription
                </span>
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "20px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>$99</span>
                <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>/year</span>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 0 20px" }} />

              {/* CTA */}
              <button
                type="button"
                onClick={handleGetAccess}
                disabled={checkoutLoading || subCheckLoading}
                style={{
                  maxWidth: "320px",
                  width: "100%",
                  margin: "0 auto",
                  display: "block",
                  padding: "11px 20px",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  background: (checkoutLoading || subCheckLoading) ? "rgba(30,122,184,0.5)" : "#1E7AB8",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (checkoutLoading || subCheckLoading) ? "not-allowed" : "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                {subCheckLoading ? "Checking subscription..." : checkoutLoading ? "Checking..." : "Get Access"}
              </button>

              {checkoutError && (
                <p style={{ fontSize: "0.8125rem", color: "#F87171", margin: "0 0 8px" }}>
                  {checkoutError}
                </p>
              )}

            </div>

            {/* Sign-in link — only shown when NOT logged in, outside pricing card */}
            {!user && (
              <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", margin: "4px 0 0", textAlign: "center" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/login?redirect=/onboarding";
                  }}
                  style={{
                    background: "none", border: "none", color: "#60B4F0",
                    fontSize: "0.8125rem", cursor: "pointer", padding: 0,
                    textDecoration: "underline", fontFamily: "inherit",
                  }}
                >
                  Sign in
                </button>
              </p>
            )}
          </>
        )}

      </div>
    );
  }

  // ── Verifying payment screen ─────────────────────────────────
  if (screen === "verifying") {
    return (
      <div ref={toolContainerRef} className="okb-tool">
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
      <div ref={toolContainerRef} className="okb-tool">
        <ToolLoadingScreen
          headingText="Building your kit"
          timeEstimate="About 3 minutes."
          steps={LOADING_STEPS}
          activeStep={loadingStep}
        />
      </div>
    );
  }

  // ── Sent screen (auto-delivered) ──────────────────────────
  if (screen === "sent") {
    return (
      <div ref={toolContainerRef} className="okb-tool">
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ display: "inline-block", marginBottom: "16px" }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="12" fill="#22C55E" fillOpacity="0.12" />
              <path d="M18 28.5L24.5 35L38 21" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.25vw, 2rem)", fontWeight: 400, fontFamily: "var(--font-display)", lineHeight: 1.25, color: "var(--text-primary)", margin: "0 0 8px" }}>
            {hireName ? `${hireName}'s` : "Your"} onboarding kit is ready.
          </h2>
          {hireTitle && (
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.55)", margin: "0 0 8px", textAlign: "center" }}>
              {hireTitle}
            </p>
          )}
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0 0 32px" }}>
            Downloaded to your device and sent to {email || "your inbox"}.
          </p>
          {fileBlob && (
            <button
              type="button"
              onClick={() => triggerDownload(fileBlob, filename)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "0.8125rem",
                color: "var(--cta, #1E7AB8)",
                textDecoration: "underline",
                cursor: "pointer",
                marginBottom: "24px",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Download again
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-lg btn-full"
            onClick={handleReset}
          >
            Build another kit
          </button>
        </div>

        <CrossSellBlock
          productName="AGENT: PIP"
          checklistItems={[
            "Improvement Plan",
            "Timeline",
            "Manager Talking Points",
          ]}
          buttonLabel="Try Now"
          href="/pip"
        />
      </div>
    );
  }

  // ── Error screen ─────────────────────────────────────────────
  // "Start over" is INTENTIONAL here. Error screens are different from email gates.
  // The user's build failed and they may want to restart with different inputs.
  // See paid-tools-copy-spec.md "Error Screens: Start Over Is Allowed".
  return (
    <div ref={toolContainerRef} className="okb-tool">
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
