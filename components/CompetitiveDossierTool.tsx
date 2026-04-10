"use client";

import { useState, useEffect, useRef } from "react";
import CrossSellBlock from "@/components/shared/CrossSellBlock";
import BackButton from "@/components/shared/BackButton";
import StepIndicator from "@/components/shared/StepIndicator";
import { triggerDownload } from "@/components/shared/fileUtils";
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
  | "error-site"
  | "error-data"
  | "error-limit"
  | "error-general";

type RelationshipType =
  | "Competitor"
  | "Prospect or lead"
  | "Partner"
  | "Vendor or supplier"
  | "Acquisition target"
  | "General research"
  | "";

type PriorityFocus =
  | "Pricing Strategy"
  | "Market Positioning"
  | "Growth Direction"
  | "Product Capabilities"
  | "Hiring Signals"
  | "Content Strategy";

const ALL_PRIORITY_FOCUS: PriorityFocus[] = [
  "Pricing Strategy",
  "Market Positioning",
  "Growth Direction",
  "Product Capabilities",
  "Hiring Signals",
  "Content Strategy",
];

const RELATIONSHIP_OPTIONS: RelationshipType[] = [
  "Competitor",
  "Prospect or lead",
  "Partner",
  "Vendor or supplier",
  "Acquisition target",
  "General research",
];

const DOSSIER_SECTIONS = [
  "Company Snapshot",
  "Business Model and Pricing",
  "Target Market and Positioning",
  "Product and Service Breakdown",
  "Growth Signals",
  "Content and Public Voice",
  "Strengths and Gaps",
  "What This Means for You",
];

// Loading steps use canonical deliverable names (matches all other tools).
// Backend sends 6 SSE pipeline events; STEP_MAP spreads them across 8 deliverables.
const LOADING_STEPS = [
  "Company Snapshot",
  "Business Model and Pricing",
  "Target Market and Positioning",
  "Product and Service Breakdown",
  "Growth Signals",
  "Content and Public Voice",
  "Strengths and Gaps",
  "What This Means for You",
];

// Maps backend pipeline step (1-6) to deliverable indices (0-7) to mark as active/complete
const STEP_MAP_ACTIVE: Record<number, number[]> = {
  1: [0],       // Mapping site → Company Snapshot active
  2: [1],       // Selecting pages → Business Model active
  3: [2],       // Scraping → Target Market active
  4: [4],       // Analyzing → Growth Signals active
  5: [6],       // Tailoring → Strengths and Gaps active
  6: [7],       // Formatting → What This Means for You active
};
const STEP_MAP_COMPLETE: Record<number, number[]> = {
  1: [0],             // Company Snapshot done
  2: [1],             // Business Model done
  3: [2, 3],          // Target Market + Product Breakdown done
  4: [4, 5],          // Growth Signals + Content and Public Voice done
  5: [6],             // Strengths and Gaps done
  6: [7],             // What This Means for You done
};

const MONTHLY_RUN_LIMIT = 15;

// ─── Storage helpers ────────────────────────────────────────────────────────────

const CD_STORAGE_KEY = "cd_form_data";

interface SavedFormData {
  companyUrl: string;
  companyName: string;
  relationshipType: RelationshipType;
  researchFocus: string;
  priorityFocusAreas: PriorityFocus[];
  existingKnowledge: string;
  jobTitle: string;
  userIndustry: string;
  userCompanyDescription: string;
}

function saveToStorage(data: SavedFormData): void {
  try { sessionStorage.setItem(CD_STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function loadFromStorage(): SavedFormData | null {
  try {
    const raw = sessionStorage.getItem(CD_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedFormData) : null;
  } catch { return null; }
}

function clearStorage(): void {
  try { sessionStorage.removeItem(CD_STORAGE_KEY); } catch { /* ignore */ }
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "0.9375rem",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "var(--radius-btn, 8px)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical" as const,
  minHeight: "88px",
  lineHeight: 1.6,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "rgba(255,255,255,0.85)",
  marginBottom: "6px",
};

const helperStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "rgba(255,255,255,0.40)",
  marginTop: "5px",
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

const fieldGroupStyle: React.CSSProperties = { marginBottom: "20px" };

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: "36px",
  cursor: "pointer",
};

// ─── Component ──────────────────────────────────────────────────────────────────

interface CompetitiveDossierToolProps {
  initialPaymentStatus?: string;
  initialSessionId?: string;
}

export default function CompetitiveDossierTool({
  initialPaymentStatus,
  initialSessionId,
}: CompetitiveDossierToolProps) {
  const { user } = useAuth();
  const toolContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // ── Screen ───────────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("paywall");

  // ── Screen 1 ─────────────────────────────────────────────────────────────────
  const [companyUrl, setCompanyUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("");

  // ── Screen 2 ─────────────────────────────────────────────────────────────────
  const [researchFocus, setResearchFocus] = useState("");
  const [priorityFocusAreas, setPriorityFocusAreas] = useState<PriorityFocus[]>([]);
  const [existingKnowledge, setExistingKnowledge] = useState("");

  // ── Screen 3 ─────────────────────────────────────────────────────────────────
  const [jobTitle, setJobTitle] = useState("");
  const [userIndustry, setUserIndustry] = useState("");
  const [userCompanyDescription, setUserCompanyDescription] = useState("");

  // ── Errors ───────────────────────────────────────────────────────────────────
  const [s1Error, setS1Error] = useState("");
  const [s3Error, setS3Error] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Paywall ──────────────────────────────────────────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [subscriptionVerified, setSubscriptionVerified] = useState(false);
  const [showReturningCheck, setShowReturningCheck] = useState(false);
  const [returningEmail, setReturningEmail] = useState("");
  const [returningCheckLoading, setReturningCheckLoading] = useState(false);
  const [returningCheckError, setReturningCheckError] = useState("");

  // ── Loading (SSE) ─────────────────────────────────────────────────────────────
  const [loadingStepStatuses, setLoadingStepStatuses] = useState<("pending" | "in_progress" | "complete")[]>(
    LOADING_STEPS.map(() => "pending")
  );

  // ── Email (auto-send after build) ─────────────────────────────────────────────
  const [email, setEmail] = useState("");

  // ── Result ───────────────────────────────────────────────────────────────────
  const [docxBase64, setDocxBase64] = useState("");
  const [resultCompanyName, setResultCompanyName] = useState("");
  const [resultPagesAnalyzed, setResultPagesAnalyzed] = useState(0);
  const [resultJobTitle, setResultJobTitle] = useState("");

  // ── Pre-fill email from auth ──────────────────────────────────────────────────
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  // ── Auto-check subscription for logged-in users on paywall ─────────────────
  useEffect(() => {
    if (screen !== "paywall" || !user?.email) return;
    if (initialPaymentStatus) return; // skip when returning from Stripe
    let cancelled = false;
    fetch("/api/verify-cd-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    })
      .then((res) => res.json())
      .then((data: { verified: boolean }) => {
        if (!cancelled && data.verified) {
          setSubscriptionVerified(true);
          setScreen("s1");
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [screen, user?.email, initialPaymentStatus]);

  // ── Handle payment return ─────────────────────────────────────────────────────
  useEffect(() => {
    if (initialPaymentStatus === "success" && initialSessionId) {
      setSubscriptionVerified(true);
      clearStorage();
      setScreen("s1");
    } else if (initialPaymentStatus === "cancelled") {
      setPaymentCancelled(true);
      // screen stays on "paywall" (initial state)
    }
  }, [initialPaymentStatus, initialSessionId]);

  // ── Scroll to tool on screen change ──────────────────────────────────────────
  // S139: also skip scroll when auto-advancing from paywall to s1 (subscriber
  // auto-check). User should land at page top, not be scrolled to the tool.
  const prevScreenRef = useRef<string>(screen);
  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = screen;
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (prev === "paywall" && screen === "s1") return;
    toolContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [screen]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function toggleFocusArea(area: PriorityFocus) {
    setPriorityFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function normalizeUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  // ── Navigation ────────────────────────────────────────────────────────────────

  function goToS2() {
    const normalized = normalizeUrl(companyUrl);
    try { new URL(normalized); } catch {
      setS1Error("Please enter a valid website URL.");
      return;
    }
    if (!relationshipType) {
      setS1Error("Please select your relationship to this company.");
      return;
    }
    setCompanyUrl(normalized);
    setS1Error("");
    setScreen("s2");
  }

  function goToS3() {
    setScreen("s3");
  }

  function goToBuilding() {
    if (!jobTitle.trim()) { setS3Error("Job title is required."); return; }
    if (!userIndustry.trim()) { setS3Error("Industry is required."); return; }
    setS3Error("");
    startGeneration();
  }

  // ── SSE generation ────────────────────────────────────────────────────────────

  async function startGeneration() {
    setScreen("loading");
    setLoadingStepStatuses(LOADING_STEPS.map(() => "pending"));

    try {
      const res = await fetch("/api/competitive-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyUrl,
          companyName: companyName || undefined,
          relationshipType,
          researchFocus: researchFocus || undefined,
          priorityFocusAreas,
          existingKnowledge: existingKnowledge || undefined,
          jobTitle,
          userIndustry,
          userCompanyDescription: userCompanyDescription || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        setErrorMsg("Something went wrong on our end. Please try again.");
        setScreen("error-general");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      // Timeout: if no SSE event arrives within 5 minutes, show error
      const STREAM_TIMEOUT_MS = 5 * 60 * 1000;
      let timeoutId = setTimeout(() => {
        if (!completed) {
          reader.cancel();
          setErrorMsg("This is taking longer than expected. Please try again.");
          setScreen("error-general");
        }
      }, STREAM_TIMEOUT_MS);

      const resetTimeout = () => {
        clearTimeout(timeoutId);
        if (!completed) {
          timeoutId = setTimeout(() => {
            if (!completed) {
              reader.cancel();
              setErrorMsg("This is taking longer than expected. Please try again.");
              setScreen("error-general");
            }
          }, STREAM_TIMEOUT_MS);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        resetTimeout();
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.trim()) continue;

          const eventMatch = part.match(/^event:\s*(.+)$/m);
          const dataMatch = part.match(/^data:\s*(.+)$/m);
          if (!eventMatch || !dataMatch) continue;

          const eventType = eventMatch[1].trim();
          let data: Record<string, unknown> = {};
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }

          if (eventType === "progress") {
            const backendStep = data.step as number;
            const status = data.status as "in_progress" | "complete";
            const map = status === "complete" ? STEP_MAP_COMPLETE : STEP_MAP_ACTIVE;
            const indices = map[backendStep] ?? [];
            setLoadingStepStatuses((prev) => {
              const updated = [...prev];
              for (const idx of indices) {
                updated[idx] = status;
              }
              return updated;
            });
          } else if (eventType === "complete") {
            completed = true;
            clearTimeout(timeoutId);
            const meta = data.metadata as { companyName: string; pagesAnalyzed: number; jobTitle: string };
            const b64 = data.docxBase64 as string;
            const cName = meta.companyName ?? companyName ?? "the company";
            const cJobTitle = meta.jobTitle ?? jobTitle;
            setDocxBase64(b64);
            setResultCompanyName(cName);
            setResultPagesAnalyzed(meta.pagesAnalyzed ?? 0);
            setResultJobTitle(cJobTitle);

            // Auto-deliver: download file + send email in background
            const blob = base64ToBlob(b64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            const fn = `${cName.replace(/[^a-zA-Z0-9]/g, "-")}-Dossier.docx`;
            triggerDownload(blob, fn);
            if (email) {
              fetch("/api/competitive-dossier-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email,
                  companyName: cName,
                  jobTitle: cJobTitle,
                  docxBase64: b64,
                  userId: user?.id ?? undefined,
                }),
              }).catch(() => {});
            }

            setScreen("sent");
          } else if (eventType === "error") {
            completed = true;
            clearTimeout(timeoutId);
            const errorType = data.type as string;
            setErrorMsg(data.message as string ?? "Something went wrong. Please try again.");
            if (errorType === "site_unreachable") setScreen("error-site");
            else if (errorType === "insufficient_data") setScreen("error-data");
            else if (errorType === "run_limit_reached") setScreen("error-limit");
            else setScreen("error-general");
          }
        }
      }

      // Stream ended without a complete or error event (Vercel killed the function)
      clearTimeout(timeoutId);
      if (!completed) {
        setErrorMsg("This is taking longer than expected. Please try again.");
        setScreen("error-general");
      }
    } catch {
      setErrorMsg("Something went wrong on our end. Please try again.");
      setScreen("error-general");
    }
  }

  // ── Sign-in handler ───────────────────────────────────────────────────────────

  function handleSignIn(): void {
    window.location.href = "/login?redirect=/company";
  }

  // ── Paywall handlers ──────────────────────────────────────────────────────────

  async function handleCheckout() {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/competitive-dossier-checkout", { method: "POST" });
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

  async function handleReturningCheck() {
    if (!returningEmail.trim()) { setReturningCheckError("Please enter your email."); return; }
    setReturningCheckLoading(true);
    setReturningCheckError("");
    try {
      const res = await fetch("/api/verify-cd-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: returningEmail.trim() }),
      });
      const data = await res.json() as { verified: boolean };
      if (data.verified) {
        setSubscriptionVerified(true);
        setScreen("s1");
      } else {
        setReturningCheckError("No active subscription found for that email. If you just purchased, please wait a moment and try again.");
        setReturningCheckLoading(false);
      }
    } catch {
      setReturningCheckError("Could not verify. Please try again.");
      setReturningCheckLoading(false);
    }
  }

  function base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
  }

  function handleDownloadAgain() {
    if (!docxBase64) return;
    const blob = base64ToBlob(docxBase64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const filename = `${resultCompanyName.replace(/[^a-zA-Z0-9]/g, "-")}-Dossier.docx`;
    triggerDownload(blob, filename);
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div ref={toolContainerRef} className="tool-container" style={{ scrollMarginTop: "136px" }}>

      {/* ── Screen 1: Target company ────────────────────────────────────────── */}
      {screen === "s1" && (
        <div>
          <StepIndicator current={1} total={3} />
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)", color: "#fff", margin: "0 0 6px" }}>
            Who do you want to research?
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", margin: "0 0 28px", lineHeight: 1.6 }}>
            Enter a company&apos;s website. We&apos;ll scan their public pages and build you a competitive intelligence dossier.
          </p>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Company website URL</label>
            <input
              type="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="https://competitor.com"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && goToS2()}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Company name <span style={optionalStyle}>(optional)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              style={inputStyle}
            />
            <p style={helperStyle}>Optional. Helps us title your report.</p>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Your relationship to this company</label>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
              style={selectStyle}
            >
              <option value="" disabled>Select one...</option>
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {s1Error && <p style={errorStyle}>{s1Error}</p>}

          <button onClick={goToS2} className="btn btn-dark-cta" style={{ width: "100%", marginTop: "8px" }}>
            Continue
          </button>
        </div>
      )}

      {/* ── Screen 2: Research focus ─────────────────────────────────────────── */}
      {screen === "s2" && (
        <div>
          <BackButton onClick={() => setScreen("s1")} />
          <StepIndicator current={2} total={3} />
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)", color: "#fff", margin: "0 0 6px" }}>
            What do you want to learn?
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", margin: "0 0 28px", lineHeight: 1.6 }}>
            The more context you give, the sharper your dossier.
          </p>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              What do you most want to learn about this company? <span style={optionalStyle}>(optional)</span>
            </label>
            <textarea
              value={researchFocus}
              onChange={(e) => setResearchFocus(e.target.value)}
              placeholder="e.g. I want to understand their pricing strategy and how they're positioning against us in the mid-market."
              style={textareaStyle}
              maxLength={500}
            />
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
              {researchFocus.length}/500
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Priority focus areas <span style={optionalStyle}>(optional)</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {ALL_PRIORITY_FOCUS.map((area) => {
                const selected = priorityFocusAreas.includes(area);
                return (
                  <button
                    key={area}
                    onClick={() => toggleFocusArea(area)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "var(--radius-tag, 6px)",
                      border: `1px solid ${selected ? "var(--cta, #1E7AB8)" : "rgba(255,255,255,0.18)"}`,
                      background: selected ? "rgba(30,122,184,0.18)" : "rgba(255,255,255,0.05)",
                      color: selected ? "#fff" : "rgba(255,255,255,0.65)",
                      fontSize: "0.8125rem",
                      fontWeight: selected ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Anything you already know? <span style={optionalStyle}>(optional)</span>
            </label>
            <textarea
              value={existingKnowledge}
              onChange={(e) => setExistingKnowledge(e.target.value)}
              placeholder="e.g. They just raised a Series B and announced a partnership with Salesforce."
              style={{ ...textareaStyle, minHeight: "72px" }}
              maxLength={500}
            />
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
              {existingKnowledge.length}/500
            </div>
            <p style={helperStyle}>We&apos;ll skip what you already know and go deeper on what&apos;s new.</p>
          </div>

          <button onClick={goToS3} className="btn btn-dark-cta" style={{ width: "100%", marginTop: "8px" }}>
            Continue
          </button>
        </div>
      )}

      {/* ── Screen 3: About you ──────────────────────────────────────────────── */}
      {screen === "s3" && (
        <div>
          <BackButton onClick={() => setScreen("s2")} />
          <StepIndicator current={3} total={3} />
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)", color: "#fff", margin: "0 0 6px" }}>
            Tell us about your role.
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", margin: "0 0 28px", lineHeight: 1.6 }}>
            This helps us tailor the analysis to what matters for someone in your position.
          </p>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Job title or role</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Marketing Director"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Industry</label>
            <input
              type="text"
              value={userIndustry}
              onChange={(e) => setUserIndustry(e.target.value)}
              placeholder="e.g. Healthcare Technology"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Brief description of your company or product <span style={optionalStyle}>(optional)</span>
            </label>
            <textarea
              value={userCompanyDescription}
              onChange={(e) => setUserCompanyDescription(e.target.value)}
              placeholder="e.g. We're a 50-person B2B SaaS company selling project management tools to healthcare organizations."
              style={textareaStyle}
              maxLength={500}
            />
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
              {userCompanyDescription.length}/500
            </div>
            <p style={helperStyle}>Optional. Enables direct comparison in your dossier.</p>
          </div>

          {s3Error && <p style={errorStyle}>{s3Error}</p>}

          <button onClick={goToBuilding} className="btn btn-dark-cta" style={{ width: "100%", marginTop: "8px" }}>
            Build My Dossier
          </button>
        </div>
      )}

      {/* ── Paywall ──────────────────────────────────────────────────────────── */}
      {screen === "paywall" && (
        <>
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
            Competitive intelligence on any company, tailored to your role.
          </h2>

          {paymentCancelled && (
            <p style={{ fontSize: "0.875rem", color: "rgba(255,200,80,0.9)", marginBottom: "16px" }}>
              Checkout was cancelled. No charge was made.
            </p>
          )}

          {/* What's included */}
          <div style={{ marginBottom: "24px", padding: "0 4px" }}>
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
              Your dossier includes
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {DOSSIER_SECTIONS.map((item) => (
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
                $149 <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>/year</span>
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

            {subscriptionVerified ? (
              <button
                type="button"
                className="btn btn-dark-cta"
                style={{ width: "100%" }}
                onClick={() => setScreen("s1")}
              >
                Get Started
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-dark-cta"
                style={{ width: "100%", opacity: checkoutLoading ? 0.7 : 1 }}
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? "Redirecting to checkout..." : "Get Access \u00B7 $149/year"}
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
                  }}
                >
                  Problems with access?
                </button>
              ) : (
                <div style={{ marginTop: "8px", textAlign: "left" }}>
                  <label style={{ ...labelStyle, fontSize: "0.8125rem" }}>Enter your subscription email</label>
                  <input
                    type="email"
                    value={returningEmail}
                    onChange={(e) => setReturningEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{ ...inputStyle, marginBottom: "10px" }}
                    onKeyDown={(e) => e.key === "Enter" && handleReturningCheck()}
                  />
                  {returningCheckError && <p style={errorStyle}>{returningCheckError}</p>}
                  <button
                    onClick={handleReturningCheck}
                    disabled={returningCheckLoading}
                    className="btn btn-dark-cta"
                    style={{ width: "100%", opacity: returningCheckLoading ? 0.7 : 1 }}
                  >
                    {returningCheckLoading ? "Checking..." : "Verify Access"}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Loading (SSE) ────────────────────────────────────────────────────── */}
      {screen === "loading" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
            fontWeight: 400,
            color: "#fff",
            margin: "0 0 8px",
          }}>
            Building your dossier
            <span className="building-dots" aria-hidden="true">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </h2>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", margin: "0 0 36px" }}>
            About 3 minutes.
          </p>
          <div style={{ textAlign: "left", maxWidth: "320px", margin: "0 auto" }}>
            {LOADING_STEPS.map((step, i) => {
              const status = loadingStepStatuses[i];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: "20px", height: "20px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {status === "complete" ? (
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid #22C55E", background: "#22C55E" }} />
                    ) : status === "in_progress" ? (
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid #1E7AB8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1E7AB8" }} />
                      </div>
                    ) : (
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: "0.9rem",
                    color: status === "complete"
                      ? "rgba(255,255,255,0.5)"
                      : status === "in_progress"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.75)",
                    fontWeight: status === "in_progress" ? 600 : 400,
                    transition: "color 0.3s ease",
                  }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
          {/* spinner removed — uses blue dot consistent with all other tools */}
        </div>
      )}

      {/* ── Sent screen (auto-delivered) ────────────────────────────────────── */}
      {screen === "sent" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "inline-block", marginBottom: "16px" }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="12" fill="#22C55E" fillOpacity="0.12" />
              <path d="M18 28.5L24.5 35L38 21" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 3.25vw, 2rem)", color: "#FFFFFF", margin: "0 0 8px", lineHeight: 1.25 }}>
            Your dossier is ready.
          </h2>
          {resultJobTitle && (
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.55)", margin: "0 0 8px", textAlign: "center" }}>
              {resultJobTitle}{resultCompanyName ? `, ${resultCompanyName}` : ""}
            </p>
          )}
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", margin: "0 0 24px" }}>
            Downloaded to your device and sent to {email || "your inbox"}.
          </p>

          {/* Proof of work preview */}
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-card, 12px)", border: "1px solid rgba(255,255,255,0.10)", padding: "16px 20px", marginBottom: "24px", textAlign: "left" }}>
            <p style={{ margin: "0 0 12px", fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
              Competitive Intelligence Dossier: {resultCompanyName}
            </p>
            <ol style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
              {DOSSIER_SECTIONS.map((s, i) => (
                <li key={i} style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>{s}</li>
              ))}
            </ol>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "rgba(255,255,255,0.40)" }}>
              {resultPagesAnalyzed} pages analyzed · Personalized for {resultJobTitle} · Based on live data
            </p>
          </div>

          {docxBase64 && (
            <button
              type="button"
              onClick={() => {
                const blob = base64ToBlob(docxBase64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                triggerDownload(blob, `${resultCompanyName.replace(/[^a-zA-Z0-9]/g, "-")}-Dossier.docx`);
              }}
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
            onClick={() => { setScreen("s1"); setCompanyUrl(""); setCompanyName(""); setRelationshipType(""); setResearchFocus(""); setPriorityFocusAreas([]); setExistingKnowledge(""); }}
            className="btn btn-primary btn-lg btn-full"
            style={{ marginBottom: "32px" }}
          >
            Build another dossier
          </button>
          <CrossSellBlock
            productName="AGENT: Workflow"
            checklistItems={[
              "Workflow Playbook",
              "AI Setup",
              "Key Insights",
            ]}
            buttonLabel="Try Now"
            href="/workflow"
          />
        </div>
      )}

      {/* ── Error: site unreachable ───────────────────────────────────────────── */}
      {screen === "error-site" && (
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", color: "#fff", margin: "0 0 12px" }}>
            We couldn&apos;t reach that website.
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", margin: "0 0 24px", lineHeight: 1.6 }}>
            The URL may be incorrect, or the site may be temporarily unavailable. Double-check the address and try again.
          </p>
          <button onClick={() => setScreen("s1")} className="btn btn-dark-cta" style={{ marginBottom: "12px", width: "100%" }}>
            Try Again
          </button>
          <button onClick={() => { setCompanyUrl(""); setCompanyName(""); setRelationshipType(""); setScreen("s1"); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", cursor: "pointer", textDecoration: "underline" }}>
            Start over
          </button>
        </div>
      )}

      {/* ── Error: insufficient data ──────────────────────────────────────────── */}
      {screen === "error-data" && (
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", color: "#fff", margin: "0 0 12px" }}>
            We couldn&apos;t find enough to work with.
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", margin: "0 0 24px", lineHeight: 1.6 }}>
            This site appears to be behind a login or has very limited public content. Try the company&apos;s main marketing website instead.
          </p>
          <button onClick={() => setScreen("s1")} className="btn btn-dark-cta" style={{ marginBottom: "12px", width: "100%" }}>
            Try a Different URL
          </button>
          <button onClick={() => { setCompanyUrl(""); setCompanyName(""); setRelationshipType(""); setScreen("s1"); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", cursor: "pointer", textDecoration: "underline" }}>
            Start over
          </button>
        </div>
      )}

      {/* ── Error: run limit ─────────────────────────────────────────────────── */}
      {screen === "error-limit" && (
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", color: "#fff", margin: "0 0 12px" }}>
            You&apos;ve reached your monthly limit.
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", margin: "0 0 12px", lineHeight: 1.6 }}>
            {errorMsg}
          </p>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", margin: "0", lineHeight: 1.6 }}>
            Questions? Reach out to{" "}
            <a href="mailto:support@promptaiagents.com" style={{ color: "var(--cta, #1E7AB8)" }}>
              support@promptaiagents.com
            </a>
          </p>
        </div>
      )}

      {/* ── Error: general ───────────────────────────────────────────────────── */}
      {screen === "error-general" && (
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", color: "#fff", margin: "0 0 12px" }}>
            Something went wrong on our end.
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", margin: "0 0 24px", lineHeight: 1.6 }}>
            Your dossier couldn&apos;t be generated. This is on us, not you. Please try again.
          </p>
          <button onClick={() => startGeneration()} className="btn btn-dark-cta" style={{ marginBottom: "12px", width: "100%" }}>
            Try Again
          </button>
          <button onClick={() => setScreen("s1")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", cursor: "pointer", textDecoration: "underline" }}>
            Start over
          </button>
        </div>
      )}

    </div>
  );
}
