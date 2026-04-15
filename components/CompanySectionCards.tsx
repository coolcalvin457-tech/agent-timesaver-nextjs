"use client";

import React from "react";

// ─── Deliverable names (canonical, from tool config) ─────────────────────────

const DOSSIER_SECTIONS = [
  { title: "Company Brief" },
  { title: "Business Model and Pricing" },
  { title: "Target Market, Positioning" },
  { title: "Product/Service Breakdown" },
  { title: "Growth Signals" },
  { title: "Public Content, Messaging" },
  { title: "Strengths and Gaps" },
  { title: "What This Means for You" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function CompanySectionCards() {
  return (
    <div className="kit-list">
      {/* Deliverable name rows (text-only, non-clickable) */}
      {DOSSIER_SECTIONS.map((section) => (
        <div
          key={section.title}
          className="kit-list-row"
          style={{ cursor: "default", minHeight: "58px", justifyContent: "center" }}
        >
          <span className="kit-list-title" style={{ textAlign: "center" }}>
            {section.title}
          </span>
        </div>
      ))}

      {/* Placeholder Example row: matches Workflow visual pattern, non-functional until sample PDF is created */}
      <div
        className="kit-list-row kit-list-row-featured"
        style={{ position: "relative", cursor: "default" }}
      >
        {/* Document thumbnail placeholder */}
        <div
          className="kit-list-thumb"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />

        {/* Badge absolutely centered in the card */}
        <span
          className="kit-list-badge"
          style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
        >
          Example
        </span>

        {/* Spacer to keep icons pushed right */}
        <div style={{ flex: 1 }} />

        {/* Preview + Download (disabled placeholders) */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            className="kit-icon-btn"
            style={{ opacity: 0.35, cursor: "default" }}
            title="Preview sample (coming soon)"
            aria-label="Preview sample dossier (coming soon)"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <span
            className="kit-icon-btn"
            style={{ opacity: 0.35, cursor: "default" }}
            title="Download sample (coming soon)"
            aria-label="Download sample dossier (coming soon)"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
