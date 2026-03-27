"use client";

import React from "react";

interface ToolEmailGateProps {
  /** Main headline, e.g. "Your prompt kit is ready." */
  headline: string;
  /** Secondary line shown below the headline, e.g. a job title or document name */
  subtitle?: string;
  /** Optional content rendered between the subtitle and the email form (e.g. Budget's sections preview card) */
  children?: React.ReactNode;
  email: string;
  onEmailChange: (val: string) => void;
  /** Called when the form is submitted — no event arg needed, preventDefault is handled internally */
  onSubmit: () => void;
  loading: boolean;
  /** Button label. Defaults to "Send My Kit" */
  buttonLabel?: string;
  /** Inline error message shown below the input row */
  errorMessage?: string;
  /** id for the email input (for htmlFor pairing). Defaults to "tool-email-input" */
  inputId?: string;
}

/**
 * ToolEmailGate — shared email capture screen used across all tools.
 *
 * Enforces:
 *   - Green checkmark icon (#22C55E), no exceptions
 *   - Display font headline with explicit white color (no CSS vars that break on dark bg)
 *   - Centered "Where should we send it?" label
 *   - No "Start over" button
 *   - Consistent input + button inline layout
 *
 * Each tool wraps this in its own outer container (tool-container/okb-tool/etc.).
 */
export default function ToolEmailGate({
  headline,
  subtitle,
  children,
  email,
  onEmailChange,
  onSubmit,
  loading,
  buttonLabel = "Send My Kit",
  errorMessage,
  inputId = "tool-email-input",
}: ToolEmailGateProps) {
  return (
    <>
      {/* ── Checkmark + headline ───────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ display: "inline-block", marginBottom: "16px" }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="12" fill="#22C55E" fillOpacity="0.12" />
            <path
              d="M18 28.5L24.5 35L38 21"
              stroke="#22C55E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2
          style={{
            fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
            fontWeight: 400,
            fontFamily: "var(--font-display)",
            lineHeight: 1.25,
            color: "#FFFFFF",
            margin: "0 0 4px",
          }}
        >
          {headline}
        </h2>
        {subtitle && (
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Optional tool-specific content (e.g. Budget sections preview) ── */}
      {children}

      {/* ── Email form ─────────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading && email.trim()) onSubmit();
        }}
        noValidate
      >
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "#FFFFFF",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          Where should we send it?
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            id={inputId}
            type="email"
            className="input"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            autoFocus
            autoComplete="email"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading || !email.trim()}
          >
            {loading ? "Sending..." : buttonLabel}
          </button>
        </div>
        {errorMessage && (
          <p
            style={{
              marginTop: "8px",
              fontSize: "0.8125rem",
              color: "#e05555",
            }}
          >
            {errorMessage}
          </p>
        )}
      </form>
    </>
  );
}
