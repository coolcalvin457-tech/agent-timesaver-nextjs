"use client";

import React from "react";

// ─── Section data ─────────────────────────────────────────────────────────────

const WORKFLOW_SECTIONS = [
  { title: "Workflow Playbook" },
  { title: "AI Setup" },
  { title: "AI Prompts" },
  { title: "Time Estimates" },
  { title: "Key Insights" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkflowSectionCards() {
  return (
    <div className="kit-list">
      {WORKFLOW_SECTIONS.map((section) => (
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
    </div>
  );
}
