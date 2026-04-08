"use client";

import React from "react";

interface CrossSellBlockProps {
  /** Product name line. e.g. "AGENT: Prompts" */
  productName: string;
  /**
   * Checklist of deliverables shown as a blue checkmark list, one per line.
   * Replaces the legacy `descriptionLines` pattern (F51, S118). Every new
   * CrossSellBlock call site should use this prop.
   */
  checklistItems?: string[];
  /**
   * @deprecated F51, S118. Legacy two-line description prop. Kept for
   * backwards compatibility while the remaining 7 tool call sites migrate
   * during the F47 Bucket B sweep. Do NOT use on new call sites.
   */
  descriptionLines?: [string, string];
  /** Button label. Canonical platform-wide is "Try Now" (S111). */
  buttonLabel: string;
  /** If provided, button navigates to this URL. If omitted, button is inert. */
  href?: string;
}

/**
 * CrossSellBlock — shared cross-sell section rendered at the bottom of tool
 * results screens.
 *
 * Enforces:
 *   - "Your Next Step" eyebrow uses `pb-system-eyebrow` class
 *   - `checklistItems` renders as a blue checkmark list (one deliverable per line)
 *   - "Built for real jobs. Not demos." is NEVER rendered inside this component
 *     — that line lives in the email footer only (S111, F52 S118)
 *   - Button uses `btn btn-cta` with solid-fill treatment (F45 cross-sell exception
 *     to the S112 dark-frame outlined cascade — cross-sell is the conversion moment)
 *   - When no `href` is provided the button is inert and shows cursor: default
 *   - Canonical button label is "Try Now" platform-wide (S111)
 */
export default function CrossSellBlock({
  productName,
  checklistItems,
  descriptionLines,
  buttonLabel,
  href,
}: CrossSellBlockProps) {
  return (
    <div
      style={{
        marginTop: "24px",
        paddingTop: "32px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p className="pb-system-eyebrow">Your Next Step</p>
      <h4
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          fontSize: "1.625rem",
          color: "rgba(255,255,255,0.92)",
          margin: "0 0 20px",
          lineHeight: 1.2,
        }}
      >
        {productName}
      </h4>

      {checklistItems && checklistItems.length > 0 ? (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 28px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {checklistItems.map((item) => (
            <li
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.5,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="11" fill="#1e7ab8" fillOpacity="0.12" />
                <path
                  d="M8 12.5L11 15.5L16.5 9.5"
                  stroke="#1e7ab8"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : descriptionLines ? (
        <>
          <p
            style={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.6,
              margin: "0 0 4px",
            }}
          >
            {descriptionLines[0]}
          </p>
          <p
            style={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            {descriptionLines[1]}
          </p>
        </>
      ) : null}

      <div style={{ display: "flex", justifyContent: "center" }}>
        {href ? (
          <a
            href={href}
            className="btn btn-cta"
            style={{ padding: "10px 28px", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.04em" }}
          >
            {buttonLabel}
          </a>
        ) : (
          <span
            role="button"
            className="btn btn-cta"
            style={{ padding: "10px 28px", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.04em", cursor: "pointer", opacity: 0.85 }}
          >
            {buttonLabel}
          </span>
        )}
      </div>
    </div>
  );
}
