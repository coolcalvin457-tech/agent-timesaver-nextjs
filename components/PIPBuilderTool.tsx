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

type IssueType = "performance" | "behavioral";
type Timeline = "30" | "60" | "90";
type CheckinSchedule = "weekly" | "biweekly" | "custom";

interface SavedFormData {
  employeeName: string;
  employeeRole: string;
  department: string;
  tenure: string;
  managerName: string;
  issueType: IssueType | "";
  priorCoaching: boolean | null;
  deficiencies: string;
  performanceStandard: string;
  improvementTargets: string;
  timeline: Timeline | "";
  startDate: string;
  checkinSchedule: CheckinSchedule | "";
  checkinCustom: string;
  supportOffered: string;
  consequences: string;
  includeEAP: boolean;
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

const PIP_STORAGE_KEY = "pip_form_data";

const LOADING_STEPS = [
  "Opening Statement",
  "Performance Deficiencies",
  "Improvement Targets",
  "Support and Resources",
  "Check-in Schedule",
  "Consequences",
  "Signature Block",
];

// ─── Storage helpers ────────────────────────────────────────────────────────────

function saveToStorage(data: SavedFormData): void {
  try {
    sessionStorage.setItem(PIP_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable — continue without saving
  }
}

function loadFromStorage(): SavedFormData | null {
  try {
    const raw = sessionStorage.getItem(PIP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedFormData) : null;
  } catch {
    return null;
  }
}

function clearStorage(): void {
  try {
    sessionStorage.removeItem(PIP_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Shared styles ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "0.9375rem",
  border: "1px solid var(--border, #E4E4E2)",
  borderRadius: "8px",
  background: "var(--surface, #FFFFFF)",
  color: "var(--text-primary)",
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
  color: "var(--text-primary)",
  marginBottom: "6px",
};

const helperStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  color: "var(--text-muted)",
  marginTop: "5px",
  lineHeight: 1.5,
};

const errorStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  color: "#DC2626",
  marginTop: "6px",
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: "20px",
};

const radioGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  marginTop: "4px",
};

const radioOptionStyle = (selected: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "10px 14px",
  border: `1.5px solid ${selected ? "var(--cta, #1E7AB8)" : "rgba(255,255,255,0.35)"}`,
  borderRadius: "8px",
  cursor: "pointer",
  background: "transparent", /* F07/F13: border only, no background tint */
  transition: "border-color 0.15s ease",
});

// ─── Component ─────────────────────────────────────────────────────────────────

interface PIPBuilderToolProps {
  initialPaymentStatus?: string;
  initialSessionId?: string;
}

export default function PIPBuilderTool({
  initialPaymentStatus,
  initialSessionId,
}: PIPBuilderToolProps) {
  const { user } = useAuth();
  // ── Tool container ref (for scroll-to-tool on screen changes) ─
  const toolContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // ── Screen state ──────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("paywall");

  // ── Screen 1: The Situation ───────────────────────────────
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [department, setDepartment] = useState("");
  const [tenure, setTenure] = useState("");
  const [managerName, setManagerName] = useState("");
  const [issueType, setIssueType] = useState<IssueType | "">("");
  const [priorCoaching, setPriorCoaching] = useState<boolean | null>(null);

  // ── Screen 2: The Performance Gap ────────────────────────
  const [deficiencies, setDeficiencies] = useState("");
  const [startDate, setStartDate] = useState("");
  const [performanceStandard, setPerformanceStandard] = useState("");
  const [improvementTargets, setImprovementTargets] = useState("");
  const [timeline, setTimeline] = useState<Timeline | "">("");

  // ── Screen 3: Support and Monitoring ─────────────────────
  const [checkinSchedule, setCheckinSchedule] = useState<CheckinSchedule | "">("");
  const [checkinCustom, setCheckinCustom] = useState("");
  const [supportOffered, setSupportOffered] = useState("");
  const [consequences, setConsequences] = useState("");
  const [includeEAP, setIncludeEAP] = useState(false);

  // ── Error state per screen ────────────────────────────────
  const [s1Error, setS1Error] = useState("");
  const [s2Error, setS2Error] = useState("");
  const [s3Error, setS3Error] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  // ── Loading animation state ───────────────────────────────
  const [loadingStep, setLoadingStep] = useState(0);

  // ── Email (auto-send after build) ─────────────────────────
  const [email, setEmail] = useState("");

  // ── Result state ──────────────────────────────────────────
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [filename, setFilename] = useState("pip-document.docx");
  const [resultRole, setResultRole] = useState("");
  const [resultTimeline, setResultTimeline] = useState("");
  const [resultSections, setResultSections] = useState<ResultSection[]>([]);
  const [copiedSectionIdx, setCopiedSectionIdx] = useState<number | null>(null);

  // ── Loading animation ─────────────────────────────────────
  useEffect(() => {
    if (screen !== "loading") return;
    setLoadingStep(0);
    // Spread 7 steps across ~3-minute build: 0s, 20s, 45s, 75s, 110s, 140s, 165s
    const stepDelays = [0, 20000, 45000, 75000, 110000, 140000, 165000];
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

  // ── After sign-in redirect, user lands on paywall (initial screen).
  // The auto-check subscription effect above handles verification.

  // ── Storage helpers ───────────────────────────────────────

  function getCurrentFormData(): SavedFormData {
    return {
      employeeName,
      employeeRole, department, tenure, managerName,
      issueType, priorCoaching,
      deficiencies, performanceStandard, improvementTargets, timeline, startDate,
      checkinSchedule, checkinCustom, supportOffered, consequences, includeEAP,
    };
  }

  function restoreFromSaved(saved: SavedFormData): void {
    setEmployeeName(saved.employeeName ?? "");
    setEmployeeRole(saved.employeeRole ?? "");
    setDepartment(saved.department ?? "");
    setTenure(saved.tenure ?? "");
    setManagerName(saved.managerName ?? "");
    setIssueType(saved.issueType ?? "");
    setPriorCoaching(saved.priorCoaching ?? null);
    setDeficiencies(saved.deficiencies ?? "");
    setPerformanceStandard(saved.performanceStandard ?? "");
    setImprovementTargets(saved.improvementTargets ?? "");
    setTimeline(saved.timeline ?? "");
    setStartDate(saved.startDate ?? "");
    setCheckinSchedule(saved.checkinSchedule ?? "");
    setCheckinCustom(saved.checkinCustom ?? "");
    setSupportOffered(saved.supportOffered ?? "");
    setConsequences(saved.consequences ?? "");
    setIncludeEAP(saved.includeEAP ?? false);
  }

  // ── Validation ────────────────────────────────────────────

  function validateS1(): boolean {
    if (!employeeRole.trim() || !department.trim() || !tenure.trim() || !managerName.trim()) {
      setS1Error("We need the role, department, tenure, and manager name to build an accurate document.");
      return false;
    }
    if (!issueType) {
      setS1Error("Please select an issue type before continuing.");
      return false;
    }
    if (priorCoaching === null) {
      setS1Error("Please indicate whether prior coaching has been given.");
      return false;
    }
    setS1Error("");
    return true;
  }

  function validateS2(): boolean {
    if (deficiencies.trim().length < 80) {
      setS2Error("Add a bit more detail here. Specific language is what makes a PIP defensible.");
      return false;
    }
    if (improvementTargets.trim().length < 50) {
      setS2Error("Add a bit more detail to the improvement targets.");
      return false;
    }
    if (!timeline) {
      setS2Error("Please select a plan duration.");
      return false;
    }
    setS2Error("");
    return true;
  }

  function validateS3(): boolean {
    if (!checkinSchedule) {
      setS3Error("Please select a check-in schedule.");
      return false;
    }
    if (checkinSchedule === "custom" && !checkinCustom.trim()) {
      setS3Error("Please describe the custom check-in schedule.");
      return false;
    }
    if (consequences.trim().length < 20) {
      setS3Error("Please describe the consequences if targets are not met.");
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

  // ── Core build logic ──────────────────────────────────────

  async function buildFromData(data: SavedFormData) {
    setScreen("loading");
    setErrorMsg("");
    setResultRole(data.employeeRole);
    setResultTimeline(data.timeline || "30");

    try {
      const payload = {
        employeeName: data.employeeName.trim(),
        employeeRole: data.employeeRole.trim(),
        department: data.department.trim(),
        tenure: data.tenure.trim(),
        managerName: data.managerName.trim(),
        issueType: data.issueType || "performance",
        priorCoaching: data.priorCoaching ?? false,
        deficiencies: data.deficiencies.trim(),
        performanceStandard: data.performanceStandard.trim(),
        improvementTargets: data.improvementTargets.trim(),
        timeline: data.timeline || "30",
        startDate: data.startDate.trim(),
        checkinSchedule: data.checkinSchedule || "weekly",
        checkinCustom: data.checkinCustom.trim(),
        supportOffered: data.supportOffered.trim(),
        consequences: data.consequences.trim(),
        includeEAP: data.includeEAP,
      };

      const res = await fetch("/api/pip-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          (json as { error?: string }).error ??
            "Something went wrong building the document. Your inputs are saved. Try again and it should work."
        );
      }

      const { docxBase64, filename: pipFilename, sections, metadata } = json as {
        docxBase64: string;
        filename: string;
        sections: ResultSection[];
        metadata: { employeeRole: string; timeline: string; employeeName: string };
      };

      // Decode base64 .docx to Blob for download
      const binaryStr = atob(docxBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      setFileBlob(blob);
      setFilename(pipFilename);
      if (metadata.timeline) setResultTimeline(metadata.timeline);
      setResultSections(sections);

      // Auto-deliver: download file + send email in background
      triggerDownload(blob, pipFilename);
      if (email) {
        fetch("/api/pip-builder-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            filename: pipFilename,
            employeeRole: metadata.employeeRole,
            timeline: metadata.timeline || data.timeline || "30",
            fileData: docxBase64,
          }),
        }).catch(() => {});
      }

      setScreen("sent");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong building the document. Your inputs are saved. Try again and it should work."
      );
      setScreen("error");
    }
  }

  async function handleBuild() {
    if (!validateS3()) return;
    await buildFromData(getCurrentFormData());
  }

  async function handleRetry() {
    await buildFromData(getCurrentFormData());
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
          successPath: "pip",
          cancelPath: "pip",
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

  // ── Legacy returning purchaser check ─────────────────────

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

  function handleReset() {
    setScreen("s1");
    setEmployeeName(""); setEmployeeRole(""); setDepartment(""); setTenure(""); setManagerName("");
    setIssueType(""); setPriorCoaching(null);
    setDeficiencies(""); setPerformanceStandard(""); setImprovementTargets(""); setTimeline("");
    setCheckinSchedule(""); setCheckinCustom(""); setSupportOffered(""); setConsequences(""); setIncludeEAP(false);
    setEmail(""); setFileBlob(null); setFilename("pip-document.docx");
    setResultSections([]); setCopiedSectionIdx(null);
    setS1Error(""); setS2Error(""); setS3Error(""); setErrorMsg("");
    setCheckoutError(""); setPaywallEmail(""); setPaymentCancelled(false);
    setShowReturningCheck(false); setReturningEmail(""); setReturningCheckError("");
    clearStorage();
  }

  // ──────────────────────────────────────────────────────────
  // ── Render screens ────────────────────────────────────────
  // ──────────────────────────────────────────────────────────

  // ── Screen 1: The Situation ───────────────────────────────
  if (screen === "s1") {
    return (
      <div ref={toolContainerRef} className="okb-tool">
        <StepIndicator current={1} total={3} />
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.25vw, 2rem)", fontWeight: 400, fontFamily: "var(--font-display)", lineHeight: 1.25, color: "var(--text-primary)", margin: 0 }}>
            Tell us about the situation.
          </h2>
        </div>

        {/* Employee Name */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Employee name <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <input
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="e.g. Jordan Smith"
            style={inputStyle}
          />
          <p style={helperStyle}>Used in the document header. Fill in now or add manually before issuing.</p>
        </div>

        {/* Employee Role */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Employee role / title          </label>
          <input
            type="text"
            value={employeeRole}
            onChange={(e) => setEmployeeRole(e.target.value)}
            placeholder="e.g. Sales Account Executive"
            style={inputStyle}
          />
        </div>

        {/* Department */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Department          </label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Sales"
            style={inputStyle}
          />
        </div>

        {/* Tenure */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Tenure          </label>
          <input
            type="text"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="e.g. 8 months"
            style={inputStyle}
          />
        </div>

        {/* Manager Name */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Manager name          </label>
          <input
            type="text"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="e.g. Michael Torres"
            style={inputStyle}
          />
        </div>

        {/* Issue Type */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Issue type          </label>
          <div style={radioGroupStyle}>
            {(["performance", "behavioral"] as IssueType[]).map((type) => (
              <div
                key={type}
                style={radioOptionStyle(issueType === type)}
                onClick={() => setIssueType(type)}
              >
                <div
                  style={{
                    width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                    border: `2px solid ${issueType === type ? "var(--cta, #1E7AB8)" : "var(--border, #E4E4E2)"}`,
                    background: issueType === type ? "var(--cta, #1E7AB8)" : "transparent",
                    transition: "all 0.15s ease",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {issueType === type && (
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#FFFFFF" }} />
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>
                    {type}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {type === "performance"
                      ? "Missed deadlines, quotas, error rates"
                      : "Conduct, communication, professionalism"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prior Coaching */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Prior coaching or feedback given?          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            {([true, false] as const).map((val) => (
              <div
                key={String(val)}
                style={{
                  ...radioOptionStyle(priorCoaching === val),
                  flex: 1,
                  justifyContent: "center",
                }}
                onClick={() => {
                  setPriorCoaching(val);
                  if (employeeRole.trim() && department.trim() && tenure.trim() && managerName.trim() && issueType) {
                    setTimeout(() => goToS2(), 180);
                  }
                }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: priorCoaching === val ? "var(--cta, #1E7AB8)" : "var(--text-primary)" }}>
                  {val ? "Yes" : "No"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {s1Error && <p style={errorStyle}>{s1Error}</p>}

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

  // ── Screen 2: The Performance Gap ────────────────────────
  if (screen === "s2") {
    return (
      <div ref={toolContainerRef} className="okb-tool">
        <BackButton onClick={goBackToS1} />
        <StepIndicator current={2} total={3} />

        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.25vw, 2rem)", fontWeight: 400, fontFamily: "var(--font-display)", lineHeight: 1.25, color: "var(--text-primary)", margin: 0 }}>
            What specifically isn&apos;t meeting expectations?
          </h2>
        </div>

        {/* Specific Deficiencies */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Specific deficiencies          </label>
          <textarea
            value={deficiencies}
            onChange={(e) => setDeficiencies(e.target.value)}
            placeholder={`e.g. Failed to meet Q1 outbound call quota (50 calls/week) for three consecutive months, averaging 28 calls/week. Missed client follow-up deadlines on 6 of 8 tracked accounts in February, measured via CRM activity log.`}
            style={{ ...textareaStyle, minHeight: "120px" }}
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {deficiencies.length}/500
          </div>
          <p style={helperStyle}>
            Include dates, frequencies, and how it was measured. Vague language is the most common reason PIPs don't hold up.
          </p>
          <QualitySignal value={deficiencies} message="Good detail. The document will reflect this." />
        </div>

        {/* Performance Standard */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Performance standard being missed{" "}
            <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <textarea
            value={performanceStandard}
            onChange={(e) => setPerformanceStandard(e.target.value)}
            placeholder="e.g. The role requires 50 outbound calls per week and client follow-up within 24 hours of contact, per the Sales Handbook (updated Jan 2026)."
            style={textareaStyle}
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {performanceStandard.length}/500
          </div>
          <p style={helperStyle}>
            If you have a documented standard (handbook, job description, offer letter), include it here. It strengthens the document. If you don't, leave it blank.
          </p>
        </div>

        {/* Improvement Targets */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Improvement targets          </label>
          <textarea
            value={improvementTargets}
            onChange={(e) => setImprovementTargets(e.target.value)}
            placeholder="e.g. Meet weekly call quota of 50 for 4 consecutive weeks. All client follow-ups logged within 24 hours, with zero exceptions over the plan period. Both tracked via HubSpot."
            style={{ ...textareaStyle, minHeight: "100px" }}
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {improvementTargets.length}/500
          </div>
          <QualitySignal value={improvementTargets} message="Good detail. The document will reflect this." />
        </div>

        {/* Timeline */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Plan duration          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            {(["30", "60", "90"] as Timeline[]).map((t) => (
              <div
                key={t}
                style={{
                  ...radioOptionStyle(timeline === t),
                  flex: 1,
                  justifyContent: "center",
                  flexDirection: "column" as const,
                  alignItems: "center",
                  padding: "12px 8px",
                }}
                onClick={() => {
                  setTimeline(t);
                  if (deficiencies.trim().length >= 80 && improvementTargets.trim().length >= 50) {
                    setTimeout(() => goToS3(), 180);
                  }
                }}
              >
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {t}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>days</span>
              </div>
            ))}
          </div>
          <p style={helperStyle}>
            30 days is standard for clear performance issues. 60–90 days for more complex behavioral situations.
          </p>
        </div>

        {/* Plan Start Date */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Plan start date <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle}
          />
          <p style={helperStyle}>If provided, the plan end date will be calculated automatically.</p>
        </div>

        {s2Error && <p style={errorStyle}>{s2Error}</p>}

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

  // ── Screen 3: Support and Monitoring ─────────────────────
  if (screen === "s3") {
    return (
      <div ref={toolContainerRef} className="okb-tool">
        <BackButton onClick={goBackToS2} />
        <StepIndicator current={3} total={3} />

        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.25vw, 2rem)", fontWeight: 400, fontFamily: "var(--font-display)", lineHeight: 1.25, color: "var(--text-primary)", margin: 0 }}>
            How will you support and monitor improvement?
          </h2>
        </div>

        {/* Check-in Schedule */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Check-in schedule          </label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            {(["weekly", "biweekly", "custom"] as CheckinSchedule[]).map((opt) => (
              <div
                key={opt}
                style={{
                  ...radioOptionStyle(checkinSchedule === opt),
                  flex: 1,
                  justifyContent: "center",
                  padding: "10px 8px",
                }}
                onClick={() => setCheckinSchedule(opt)}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", textAlign: "center" as const }}>
                  {opt === "biweekly" ? "Bi-weekly" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </span>
              </div>
            ))}
          </div>
          {checkinSchedule === "custom" && (
            <input
              type="text"
              value={checkinCustom}
              onChange={(e) => setCheckinCustom(e.target.value)}
              placeholder="e.g. Every Friday with manager, monthly with HR"
              style={{ ...inputStyle, marginTop: "8px" }}
            />
          )}
        </div>

        {/* Support Offered */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Support being offered{" "}
            <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <textarea
            value={supportOffered}
            onChange={(e) => setSupportOffered(e.target.value)}
            placeholder="e.g. Weekly 30-minute coaching session with manager. Access to the company's sales training library. Performance dashboard reviewed together at each check-in."
            style={textareaStyle}
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {supportOffered.length}/500
          </div>
          <p style={helperStyle}>
            Even a brief line here strengthens the document. It shows the company took a reasonable step before any disciplinary action.
          </p>
        </div>

        {/* Consequences */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>
            Consequences if targets are not met          </label>
          <textarea
            value={consequences}
            onChange={(e) => setConsequences(e.target.value)}
            placeholder="e.g. Failure to meet the improvement targets outlined in this plan may result in further corrective action, up to and including termination of employment."
            style={textareaStyle}
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {consequences.length}/500
          </div>
          <p style={helperStyle}>
            Plain language is fine. State it clearly so there's no ambiguity about what happens next.
          </p>
          <QualitySignal value={consequences} message="Good detail. The document will reflect this." />
        </div>

        {/* EAP Toggle */}
        <div style={{ ...fieldGroupStyle, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-alt, #F8F8F6)", borderRadius: "8px", border: "1px solid var(--border, #E4E4E2)" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Include EAP reference
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Adds an EAP reference to the support section
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIncludeEAP(!includeEAP)}
            style={{
              width: "44px", height: "24px", borderRadius: "12px", border: "none",
              background: includeEAP ? "var(--cta, #1E7AB8)" : "var(--border, #E4E4E2)",
              cursor: "pointer", position: "relative", transition: "background 0.2s ease", flexShrink: 0,
            }}
            aria-checked={includeEAP}
            role="switch"
          >
            <div style={{
              position: "absolute", top: "3px",
              left: includeEAP ? "22px" : "3px",
              width: "18px", height: "18px",
              borderRadius: "50%", background: "#FFFFFF",
              transition: "left 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </button>
        </div>

        {s3Error && <p style={errorStyle}>{s3Error}</p>}

        <button
          type="button"
          className="btn btn-primary btn-lg btn-full"
          onClick={goToBuild}
          style={{ marginTop: "8px" }}
        >
          Build My PIP
        </button>
      </div>
    );
  }

  // ── Paywall screen ───────────────────────────────────────
  if (screen === "paywall") {
    return (
      <div ref={toolContainerRef} className="okb-tool">

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
          Performance Improvement Plans.
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
            {[
              "Opening Statement",
              "Performance Deficiencies",
              "Improvement Targets",
              "Support and Resources",
              "Check-in Schedule",
              "Consequences",
              "Signature Block",
            ].map((item) => (
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

        {/* ── Subscription active: skip payment, show Build button ── */}
        {subscriptionVerified ? (
          <div style={{ background: "var(--dark, #161618)", borderRadius: "12px", padding: "24px 26px", marginBottom: "16px" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#FFFFFF" }}>
                HR Agents Package
              </span>
              <span style={{
                fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "3px 10px", borderRadius: "20px",
                background: "rgba(34,197,94,0.2)", color: "#4ADE80",
                border: "1px solid rgba(34,197,94,0.35)",
              }}>
                Active
              </span>
            </div>

            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: "0 0 16px" }}>
              Your subscription is active. Build as many PIPs as you need.
            </p>

            <button
              type="button"
              onClick={() => {
                setEmail(paywallEmail.trim());
                setScreen("s1");
              }}
              style={{
                width: "100%", padding: "13px 20px", fontSize: "0.9375rem", fontWeight: 700,
                background: "#1E7AB8", color: "#FFFFFF",
                border: "none", borderRadius: "8px",
                cursor: "pointer", transition: "background 0.15s ease",
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
                HR Agents Package
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
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>$99</span>
              <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>/year</span>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", margin: "0 0 28px" }} />

            {/* CTA */}
            <button
              type="button"
              className="btn-paywall-cta"
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
              }}
            >
              {subCheckLoading ? "Checking subscription..." : checkoutLoading ? "Checking..." : "Get Access"}
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
                  onClick={() => {
                    window.location.href = "/login?redirect=/pip";
                  }}
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
    );
  }

  // ── Verifying payment screen ──────────────────────────────
  if (screen === "verifying") {
    return (
      <div ref={toolContainerRef} className="okb-tool">
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{
            display: "inline-block", width: "32px", height: "32px",
            border: "3px solid rgba(30,122,184,0.2)", borderTopColor: "#1E7AB8",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "20px",
          }} />
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>
            Verifying your purchase...
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
            This only takes a moment.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading screen ────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div ref={toolContainerRef} className="okb-tool">
        <ToolLoadingScreen
          headingText="Building your plan"
          timeEstimate="About 3 minutes"
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
            {employeeName ? `${employeeName}'s` : "Your"} PIP is ready.
          </h2>
          {employeeRole && (
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.55)", margin: "0 0 8px", textAlign: "center" }}>
              {employeeRole}
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
            Build another PIP
          </button>
        </div>

        {/* ── In-browser results (S149) ──────────────────────── */}
        {resultSections.length > 0 && (
          <div style={{ marginTop: "56px", textAlign: "left" }}>
            {resultSections.map((section, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "var(--radius-card, 12px)",
                  padding: "24px",
                  marginBottom: "16px",
                  position: "relative",
                }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "rgba(255,255,255,0.40)",
                    textTransform: "uppercase",
                    margin: "0 0 12px",
                  }}
                >
                  {String(idx + 1).padStart(2, "0")} {section.title}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const text = section.items
                      ? (section.content ? section.content + "\n\n" : "") + section.items.map((it) => `${it.label}\n${it.detail}`).join("\n\n")
                      : section.content;
                    navigator.clipboard.writeText(text).then(() => {
                      setCopiedSectionIdx(idx);
                      setTimeout(() => setCopiedSectionIdx(null), 2000);
                    }).catch(() => {});
                  }}
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    background: "none",
                    border: "none",
                    padding: "4px 8px",
                    fontSize: "0.8125rem",
                    color: copiedSectionIdx === idx ? "#22C55E" : "var(--cta, #1E7AB8)",
                    cursor: "pointer",
                    transition: "color 0.15s ease",
                  }}
                >
                  {copiedSectionIdx === idx ? "\u2713 Copied" : "Copy"}
                </button>
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
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: "0 0 4px" }}>
                          {item.label}
                        </p>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "rgba(255,255,255,0.65)", margin: 0, whiteSpace: "pre-line" }}>
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

        <CrossSellBlock
          productName="AGENT: Onboarding"
          checklistItems={[
            "Welcome Letter",
            "First-Week Schedule",
            "30-60-90 Day Plan",
            "New Hire Checklist",
          ]}
          buttonLabel="Try Now"
          href="/onboarding"
        />
      </div>
    );
  }

  // ── Error screen ──────────────────────────────────────────
  // "Start over" is INTENTIONAL here. Error screens are different from email gates.
  // The user's build failed and they may want to restart with different inputs.
  // See paid-tools-copy-spec.md "Error Screens: Start Over Is Allowed".
  return (
    <div ref={toolContainerRef} className="okb-tool">
      <div style={{ padding: "8px 0" }}>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.6 }}>
          {errorMsg || "Something went wrong building the document. Your inputs are saved. Try again and it should work."}
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
