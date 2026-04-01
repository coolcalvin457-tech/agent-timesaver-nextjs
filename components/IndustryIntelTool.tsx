"use client";

import { useState, useRef, useEffect } from "react";
import { track } from "@vercel/analytics";
import type { IndustryIntelData } from "@/app/api/industry-intel/route";
import ToolEmailGate from "@/components/shared/ToolEmailGate";
import ToolLoadingScreen from "@/components/shared/ToolLoadingScreen";
import BackButton from "@/components/shared/BackButton";
import { triggerDownload } from "@/components/shared/fileUtils";
import { useAuth } from "@/components/AuthProvider";

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANY_SIZE_OPTIONS = [
  "Under 200",
  "200-5,000",
  "5,000+",
];

const DECISION_SCOPE_OPTIONS = [
  "I am a freelancer, or oversee less than 3 people",
  "I set the direction for an entire team",
  "I manage multiple teams and numerous projects",
];

const FOCUS_AREA_OPTIONS = [
  "Competitor activity",
  "Industry trends and forecasts",
  "Regulatory and compliance changes",
  "Hiring and talent trends",
  "Technology shifts",
  "Market conditions and economic signals",
];

const LOADING_STEPS = ["Insight", "Connection", "Strategy", "Sources"];

type Screen = "s1" | "s2" | "s3" | "loading" | "email-gate" | "sent";

// ─── Screen 3 config per focus area ──────────────────────────────────────────

function getScreen3Config(focusArea: string): { headline: string; placeholder: string } {
  switch (focusArea) {
    case "Competitor activity":
      return {
        headline: "Name up to 3 competitors you want intel on.",
        placeholder: "e.g. Accenture, Deloitte, McKinsey",
      };
    case "Industry trends and forecasts":
      return {
        headline: "What part of your industry are you most focused on right now?",
        placeholder: "e.g. AI adoption, supply chain shifts, workforce changes",
      };
    case "Regulatory and compliance changes":
      return {
        headline: "Any specific regulations or policies you're tracking?",
        placeholder: "e.g. HIPAA updates, SEC reporting changes, state labor laws",
      };
    case "Hiring and talent trends":
      return {
        headline: "What's your biggest talent challenge right now?",
        placeholder: "e.g. retention, hiring speed, compensation benchmarking",
      };
    case "Technology shifts":
      return {
        headline: "Any specific tools or platforms you're evaluating?",
        placeholder: "e.g. AI tools, ERP migration, automation platforms",
      };
    case "Market conditions and economic signals":
      return {
        headline: "What's top of mind for your business right now?",
        placeholder: "e.g. budget pressure, expansion planning, pricing strategy",
      };
    default:
      return {
        headline: "Anything specific you want intel on?",
        placeholder: "Add any additional context (optional)",
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IndustryIntelTool() {
  const { user } = useAuth();

  // Screen
  const [screen, setScreen] = useState<Screen>("s1");
  const [flipStage, setFlipStage] = useState<"idle" | "in">("idle");

  // Screen 1 inputs
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [decisionScope, setDecisionScope] = useState("");

  // Screen 2 input
  const [focusArea, setFocusArea] = useState("");

  // Screen 3 inputs
  const [screen3Input, setScreen3Input] = useState("");
  const [competitor1, setCompetitor1] = useState("");
  const [competitor2, setCompetitor2] = useState("");
  const [competitor3, setCompetitor3] = useState("");

  // Results + delivery
  const [intelData, setIntelData] = useState<IndustryIntelData | null>(null);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const topRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const authSkipFired = useRef(false);

  // ── Track start ──────────────────────────────────────────────────
  useEffect(() => {
    track("industry_intel_started");
  }, []);

  // ── Screen transition ────────────────────────────────────────────
  const go = (s: Screen) => {
    setScreen(s);
    setFlipStage("in");
  };

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

  // ── Loading step advancement ─────────────────────────────────────
  useEffect(() => {
    if (screen !== "loading") return;
    setLoadingStep(0);
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 7500)
    );
    return () => timers.forEach(clearTimeout);
  }, [screen]);

  // ── Auth skip (free tool: auto-skip email gate when logged in) ───
  useEffect(() => {
    if (screen === "email-gate" && user && intelData && !authSkipFired.current) {
      authSkipFired.current = true;
      setEmail(user.email);
      deliverIntel(user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, user, intelData]);

  const flipClass = flipStage === "in" ? "screen-flip-in" : "";

  // ── Reset ────────────────────────────────────────────────────────
  const handleReset = () => {
    setJobTitle("");
    setCompanyName("");
    setIndustry("");
    setCompanySize("");
    setDecisionScope("");
    setFocusArea("");
    setScreen3Input("");
    setCompetitor1("");
    setCompetitor2("");
    setCompetitor3("");
    setIntelData(null);
    setEmail("");
    setError("");
    authSkipFired.current = false;
    go("s1");
  };

  // ── Generate intel ───────────────────────────────────────────────
  const handleGenerate = async () => {
    go("loading");
    setError("");
    try {
      const res = await fetch("/api/industry-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          companyName: companyName || undefined,
          industry,
          companySize,
          decisionScope,
          focusArea,
          screen3Input: screen3Input || undefined,
          competitor1: competitor1 || undefined,
          competitor2: competitor2 || undefined,
          competitor3: competitor3 || undefined,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data: IndustryIntelData = await res.json();
      setIntelData(data);
      track("industry_intel_generated", { industry, focusArea });
      go("email-gate");
    } catch {
      setError("Something went wrong building your intel. Please try again.");
      go("s3");
    }
  };

  // ── Deliver intel (docx download + email) ────────────────────────
  const deliverIntel = async (emailAddress: string) => {
    if (!intelData) return;
    setEmailLoading(true);
    try {
      const res = await fetch("/api/industry-intel-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailAddress,
          jobTitle,
          companyName: companyName || undefined,
          industry,
          focusArea,
          intelData,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const safeIndustry = industry.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        triggerDownload(blob, `industry-intel-${safeIndustry}.docx`);
        track("industry_intel_delivered", { industry, focusArea });
      }
    } catch {
      // Fail silently — user still sees sent screen
    }
    setEmailLoading(false);
    go("sent");
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !intelData) return;
    await deliverIntel(email.trim());
  };

  // ── Progress bar ─────────────────────────────────────────────────
  const progressIndex = ["s1", "s2", "s3"].indexOf(screen);
  const ProgressBar = () => (
    <div className="progress-bar">
      {["s1", "s2", "s3"].map((s, i) => (
        <div
          key={s}
          className={`progress-pip ${i < progressIndex ? "done" : i === progressIndex ? "active" : ""}`}
        />
      ))}
    </div>
  );

  // ── Shared styles ─────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "6px",
    letterSpacing: "0.01em",
  };
  const fieldGroupStyle: React.CSSProperties = { marginBottom: "20px" };
  const optionalStyle: React.CSSProperties = { fontWeight: 400, color: "var(--text-muted)", marginLeft: "4px" };
  const headlineStyle: React.CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 400,
    fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
    lineHeight: 1.25,
    color: "#FFFFFF",
    margin: "0 0 28px",
  };

  // ─── Screen: S1 — Your Industry ──────────────────────────────────
  if (screen === "s1") {
    const canAdvance = jobTitle.trim() && industry.trim() && companySize && decisionScope;

    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <ProgressBar />
          <h2 style={headlineStyle}>Your Industry</h2>

          {/* Job title */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Job title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. HR Director, Finance Manager, VP of Operations"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Company name (optional) */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Company name <span style={optionalStyle}>(optional)</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Deloitte, Regional Medical Center"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {/* Industry */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Industry</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Healthcare, Financial Services, Manufacturing"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          {/* Company size */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Company size</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <button
                  key={option}
                  className={`choice ${companySize === option ? "selected" : ""}`}
                  onClick={() => setCompanySize(option)}
                >
                  <span className="choice-dot" />
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Decision scope */}
          <div style={{ ...fieldGroupStyle, marginBottom: "8px" }}>
            <label style={labelStyle}>Decision scope</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              {DECISION_SCOPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  className={`choice ${decisionScope === option ? "selected" : ""}`}
                  onClick={() => setDecisionScope(option)}
                >
                  <span className="choice-dot" />
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "28px" }}
            onClick={() => {
              track("industry_intel_s1_complete");
              go("s2");
            }}
            disabled={!canAdvance}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ─── Screen: S2 — Type of Intel ──────────────────────────────────
  if (screen === "s2") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <BackButton onClick={() => go("s1")} />
          <ProgressBar />
          <h2 style={headlineStyle}>Type of Intel</h2>
          <div className="choices">
            {FOCUS_AREA_OPTIONS.map((option) => (
              <button
                key={option}
                className={`choice ${focusArea === option ? "selected" : ""}`}
                onClick={() => {
                  setFocusArea(option);
                  setTimeout(() => {
                    track("industry_intel_s2_complete", { focusArea: option });
                    go("s3");
                  }, 180);
                }}
              >
                <span className="choice-dot" />
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Screen: S3 — Sharpen Focus ──────────────────────────────────
  if (screen === "s3") {
    const s3Config = getScreen3Config(focusArea);
    const isCompetitor = focusArea === "Competitor activity";

    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <BackButton onClick={() => go("s2")} />
          <ProgressBar />
          <h2 style={headlineStyle}>Sharpen Focus</h2>

          {error && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(220,50,50,0.07)",
              border: "1px solid rgba(220,50,50,0.15)",
              borderRadius: "var(--radius-input)",
              fontSize: "0.875rem",
              color: "#c0392b",
              marginBottom: "16px",
            }}>
              {error}
            </div>
          )}

          {isCompetitor ? (
            <>
              {/* Competitor name fields */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  {s3Config.headline} <span style={optionalStyle}>(optional)</span>
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                  <input
                    type="text"
                    className="input"
                    placeholder={s3Config.placeholder}
                    value={competitor1}
                    onChange={(e) => setCompetitor1(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Second competitor (optional)"
                    value={competitor2}
                    onChange={(e) => setCompetitor2(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Third competitor (optional)"
                    value={competitor3}
                    onChange={(e) => setCompetitor3(e.target.value)}
                  />
                </div>
              </div>
              {/* Specific angle */}
              <div style={{ ...fieldGroupStyle, marginBottom: "8px" }}>
                <label style={labelStyle}>
                  Anything specific? <span style={optionalStyle}>(optional)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. a product launch, a pricing change"
                  value={screen3Input}
                  onChange={(e) => setScreen3Input(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div style={{ ...fieldGroupStyle, marginBottom: "8px" }}>
              <label style={labelStyle}>
                {s3Config.headline} <span style={optionalStyle}>(optional)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder={s3Config.placeholder}
                value={screen3Input}
                onChange={(e) => setScreen3Input(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "8px" }}
            onClick={handleGenerate}
          >
            Build My Intel
          </button>
        </div>
      </div>
    );
  }

  // ─── Screen: Loading ──────────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <ToolLoadingScreen
          headingText="Building your intel."
          timeEstimate="About 30 seconds."
          steps={LOADING_STEPS}
          activeStep={loadingStep}
        />
      </div>
    );
  }

  // ─── Screen: Email Gate ───────────────────────────────────────────
  if (screen === "email-gate" && intelData) {
    const subtitle = [industry, jobTitle, focusArea].filter(Boolean).join(" · ");
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen">
          <ToolEmailGate
            headline="Your intel is ready."
            subtitle={subtitle || undefined}
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleEmailSubmit}
            loading={emailLoading}
            buttonLabel="Send My Intel"
            inputId="ii-email"
          />
        </div>
      </div>
    );
  }

  // ─── Screen: Sent ─────────────────────────────────────────────────
  if (screen === "sent") {
    return (
      <div className={`tool-container${flipClass ? ` ${flipClass}` : ""}`} ref={topRef}>
        <div className="screen" style={{ textAlign: "center" }}>

          {/* Checkmark */}
          <div style={{ display: "inline-block", marginBottom: "20px" }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="56" height="56" rx="12" fill="#1A7A4A" fillOpacity="0.1" />
              <path d="M16 28l7 7L40 20" stroke="#1A7A4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
            lineHeight: 1.25,
            color: "#FFFFFF",
            margin: "0 0 32px",
          }}>
            Your intel is in your inbox.
          </h2>

          {/* Primary CTA */}
          <button className="btn btn-primary btn-lg btn-full" onClick={handleReset}>
            Get Free Intel
          </button>

          {/* Cross-sell — Workflow Builder */}
          <div style={{
            marginTop: "32px",
            paddingTop: "28px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            textAlign: "left",
          }}>
            <p className="pb-system-eyebrow" style={{ marginBottom: "8px" }}>YOUR NEXT STEP</p>
            <p style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "1.25rem",
              color: "#FFFFFF",
              margin: "0 0 8px",
              lineHeight: 1.3,
            }}>
              Want this delivered every Monday morning?
            </p>
            <p style={{
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.55)",
              margin: "0 0 16px",
              lineHeight: 1.6,
            }}>
              Workflow Builder turns this into a recurring insight. Set it once. It runs on autopilot.
            </p>
            <a
              href="/workflow-builder"
              className="btn btn-dark-cta btn-full"
              style={{ display: "block", textAlign: "center", textDecoration: "none" }}
            >
              Try Workflow Builder
            </a>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
