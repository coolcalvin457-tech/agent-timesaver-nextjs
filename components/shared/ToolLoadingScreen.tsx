"use client";

import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToolLoadingScreenProps {
  /** Main heading text. e.g. "Building your prompt kit." */
  headingText: string;
  /** Timing line shown below the heading. e.g. "About 1 minute."
   *  Optional. Omit on intermediate/sub-5-second loading states where a
   *  countdown would feel jarring (per Layer 1 §1.3, S112). */
  timeEstimate?: string;

  // ── Checklist variant (paid tools + AGENT: Prompts) ──────────────────────
  /** Step labels for the animated checklist.
   *  Omit (or pass []) to render the simple spinner variant instead. */
  steps?: string[];
  /** Currently active step index (0-based). All prior indices are shown as done. */
  activeStep?: number;

  // ── Spinner variant (free tools: AGENT: Spreadsheets, Timesaver) ──────────
  /** Optional secondary line shown below the heading and before timeEstimate.
   *  Spinner variant only. e.g. "Calculating hours saved..." or a rotating status message. */
  subLine?: string;
  /** Key for the subLine element. Pass a changing value (e.g. message index) to
   *  remount the element and restart any CSS transition/animation on each change. */
  subLineKey?: React.Key;
}

/**
 * ToolLoadingScreen — shared loading screen used across all tools.
 *
 * Two variants selected automatically:
 *
 * CHECKLIST (steps provided):
 *   Enforces: display font heading with explicit #FFFFFF (no CSS vars), centered layout,
 *   consistent circle indicators with explicit hardcoded colors, PromptBuilderTool as
 *   the reference implementation.
 *
 * SPINNER (no steps):
 *   Renders spinner + heading + optional subLine + timing. Wrap the output in a
 *   <div className="loading-screen"> in the parent tool.
 *
 * The component does NOT render the outer tool container (tool-container / okb-tool /
 * loading-screen). Each tool provides its own outer wrapper.
 */
export default function ToolLoadingScreen({
  headingText,
  timeEstimate,
  steps = [],
  activeStep = 0,
  subLine,
  subLineKey,
}: ToolLoadingScreenProps) {

  // ── Checklist variant ──────────────────────────────────────────────────────
  if (steps.length > 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0 24px" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
            fontWeight: 400,
            lineHeight: 1.25,
            color: "#FFFFFF",
            margin: "0 0 6px",
          }}
        >
          {headingText}
        </h2>
        {timeEstimate && (
          <p
            className="loading-subline"
            style={{ marginTop: "8px", marginBottom: "32px" }}
          >
            {timeEstimate}
          </p>
        )}

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
          {steps.map((step, i) => {
            const isDone = i < activeStep;
            const isActive = i === activeStep;
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
                {/* Circle indicator */}
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: `1.5px solid ${
                      isDone ? "#22C55E" : isActive ? "#1E7AB8" : "rgba(255,255,255,0.2)"
                    }`,
                    background: isDone ? "#22C55E" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "0.6875rem",
                    color: "#FFFFFF",
                    transition: "all 0.4s ease",
                  }}
                >
                  {isDone ? (
                    "✓"
                  ) : isActive ? (
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#1E7AB8",
                        display: "block",
                      }}
                    />
                  ) : null}
                </span>

                {/* Step label — explicit colors, never CSS vars */}
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: isDone
                      ? "rgba(255,255,255,0.5)"
                      : isActive
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.75)",
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
    );
  }

  // ── Spinner variant (no icon above heading per Layer 1 §1.3, S111) ────────
  // Intermediate "Thinking" state: when no subLine and no timeEstimate are
  // provided, the headline is rendered as a calm one-word loader with animated
  // ellipsis dots cycling 0→3 every ~400ms. Borrows the universal "Claude is
  // thinking…" / "ChatGPT is thinking…" language. Locked in Layer 1 §1.3 (S112).
  const isIntermediate = !subLine && !timeEstimate;

  return (
    <div style={{ paddingTop: "40px" }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
          fontWeight: 400,
          lineHeight: 1.25,
          color: "#FFFFFF",
          margin: "0 0 6px",
          textAlign: "center",
        }}
      >
        {isIntermediate ? (
          // F49 (S119): wrap the headline word in .thinking-word so the
          // .thinking-dots can be absolutely positioned at its right edge
          // without consuming layout width. Keeps the word visually centered.
          <span className="thinking-word">
            {headingText}
            <span className="thinking-dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
            <span className="sr-only"> (loading)</span>
          </span>
        ) : (
          headingText
        )}
      </h2>
      {subLine && (
        <p key={subLineKey} className="loading-subline">
          {subLine}
        </p>
      )}
      {timeEstimate && (
        <p className="loading-subline" style={{ marginTop: "8px" }}>
          {timeEstimate}
        </p>
      )}
    </div>
  );
}
