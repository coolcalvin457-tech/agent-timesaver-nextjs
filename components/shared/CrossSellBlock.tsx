"use client";

import React from "react";

interface CrossSellBlockProps {
  /** Product name line. e.g. "AGENT: Workflow Builder" */
  productName: string;
  /** Two description lines shown below the product name */
  descriptionLines: [string, string];
  /** Button label. e.g. "Try Now" | "Get Early Access" */
  buttonLabel: string;
  /** If provided, button navigates to this URL. If omitted, button is inert (cursor: default). */
  href?: string;
}

/**
 * CrossSellBlock — shared cross-sell section rendered at the bottom of tool results screens.
 *
 * Enforces:
 *   - "Your Next Step" eyebrow uses `pb-system-eyebrow` class
 *   - Button uses `btn btn-dark-cta`
 *   - When no `href` is provided the button does nothing and shows cursor: default
 *     (no false promise to the user)
 *   - Consistent spacing between eyebrow, heading, description, and button
 */
export default function CrossSellBlock({
  productName,
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
      <div style={{ display: "flex", justifyContent: "center" }}>
        {href ? (
          <a
            href={href}
            className="btn btn-dark-cta"
            style={{ padding: "10px 28px", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.04em" }}
          >
            {buttonLabel}
          </a>
        ) : (
          <button
            type="button"
            className="btn btn-dark-cta"
            style={{ padding: "10px 28px", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.04em", cursor: "default" }}
            disabled
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}
