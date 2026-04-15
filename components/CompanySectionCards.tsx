"use client";

import React from "react";

// ─── Deliverable names (canonical, from tool config) ─────────────────────────

const DOSSIER_SECTIONS = [
  { title: "Company Snapshot" },
  { title: "Business Model and Pricing" },
  { title: "Target Market and Positioning" },
  { title: "Product and Service Breakdown" },
  { title: "Growth Signals" },
  { title: "Content and Public Voice" },
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

      {/* Placeholder Example row (no sample PDF yet) */}
      <div
        className="kit-list-row kit-list-row-featured"
        style={{ position: "relative", cursor: "default" }}
      >
        <span
          className="kit-list-badge"
          style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
        >
          Example
        </span>
      </div>
    </div>
  );
}
