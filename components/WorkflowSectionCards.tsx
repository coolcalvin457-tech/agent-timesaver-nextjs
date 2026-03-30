"use client";

import React, { useState, useEffect, useCallback } from "react";

// ─── Card data ────────────────────────────────────────────────────────────────

const STANDARD_CARDS = [
  {
    title: "Workflow Playbook",
    description: "Your full step-by-step process, start to finish.",
  },
  {
    title: "AI Setup",
    description: "Which tools to open at each step.",
  },
  {
    title: "AI Prompts",
    description: "Copy-pasteable prompts, ready to run.",
  },
  {
    title: "Time Estimates",
    description: "How long each step takes, and the total.",
  },
  {
    title: "Key Insights",
    description: "Specific tips for this workflow.",
  },
];

const SAMPLE_PDF = "/samples/workflow-builder-sample.pdf";
const SAMPLE_DOCX = "/samples/workflow-builder-sample.docx";

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkflowSectionCards() {
  const [previewOpen, setPreviewOpen] = useState(false);

  const openPreview = () => setPreviewOpen(true);
  const closePreview = useCallback(() => setPreviewOpen(false), []);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewOpen, closePreview]);

  useEffect(() => {
    document.body.style.overflow = previewOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [previewOpen]);

  return (
    <>
      {/* ── 3x2 card grid ──────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {/* Row 1: standard cards */}
        {STANDARD_CARDS.slice(0, 3).map((card) => (
          <div
            key={card.title}
            style={{
              padding: "18px 20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: "6px",
                lineHeight: 1.3,
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.5,
              }}
            >
              {card.description}
            </div>
          </div>
        ))}

        {/* Row 2: two standard cards + EXAMPLE card */}
        {STANDARD_CARDS.slice(3, 5).map((card) => (
          <div
            key={card.title}
            style={{
              padding: "18px 20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: "6px",
                lineHeight: 1.3,
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.5,
              }}
            >
              {card.description}
            </div>
          </div>
        ))}

        {/* EXAMPLE card — highlighted treatment */}
        <div
          style={{
            padding: "18px 20px",
            background: "#161618",
            border: "1px solid rgba(30,122,184,0.40)",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "border-color 0.15s ease",
          }}
          onClick={openPreview}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openPreview();
          }}
          aria-label="Preview example workflow output"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(30,122,184,0.80)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(30,122,184,0.40)";
          }}
        >
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "#1E7AB8",
              marginBottom: "8px",
            }}
          >
            Example
          </div>
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: "6px",
              lineHeight: 1.3,
            }}
          >
            Pharma Rep Workflow
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.5,
              marginBottom: "14px",
            }}
          >
            See what a real output looks like.
          </div>

          {/* Preview + Download icons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPreview();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                background: "rgba(30,122,184,0.15)",
                border: "1px solid rgba(30,122,184,0.30)",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "0.6875rem",
                color: "#60B4F0",
                fontWeight: 600,
              }}
              aria-label="Preview sample workflow"
            >
              {/* Search icon */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Preview
            </button>
            <a
              href={SAMPLE_DOCX}
              download
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                background: "rgba(30,122,184,0.15)",
                border: "1px solid rgba(30,122,184,0.30)",
                borderRadius: "5px",
                fontSize: "0.6875rem",
                color: "#60B4F0",
                fontWeight: 600,
                textDecoration: "none",
              }}
              aria-label="Download sample workflow"
            >
              {/* Download icon */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </a>
          </div>
        </div>
      </div>

      {/* ── PDF Preview Modal ─────────────────────────────────── */}
      {previewOpen && (
        <div
          className="kit-modal-backdrop"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-label="Preview: Example Workflow Output"
        >
          <div
            className="kit-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kit-modal-header">
              <span className="kit-modal-title">Example Workflow Output</span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <a
                  href={SAMPLE_PDF}
                  download
                  className="kit-modal-download"
                  title="Download"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </a>
                <button
                  type="button"
                  onClick={closePreview}
                  className="kit-modal-close"
                  aria-label="Close preview"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <iframe
              src={`${SAMPLE_PDF}#toolbar=0`}
              className="kit-modal-iframe"
              title="Example Workflow Output"
            />
          </div>
        </div>
      )}
    </>
  );
}
