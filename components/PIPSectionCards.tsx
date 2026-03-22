"use client";

import React, { useState, useEffect, useCallback } from "react";

const PIP_SECTIONS = [
  { number: "01", title: "Opening Statement" },
  { number: "02", title: "Performance Deficiencies" },
  { number: "03", title: "Improvement Targets" },
  { number: "04", title: "Support & Resources" },
  { number: "05", title: "Accountability Plan" },
];

const SAMPLE_PDF = "/samples/pip-sample-output.pdf";

export default function PIPSectionCards() {
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
      <div className="kit-list">
        {/* Document section rows */}
        {PIP_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="kit-list-row"
            style={{ cursor: "default" }}
          >
            {/* Section number */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.05em",
                }}
              >
                {section.number}
              </span>
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="kit-list-title">{section.title}</span>
            </div>
          </div>
        ))}

        {/* Featured: Sample Output row */}
        <div
          className="kit-list-row kit-list-row-featured"
          onClick={openPreview}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openPreview();
          }}
          aria-label="Preview sample PIP output"
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span className="kit-list-badge">Sample Output</span>
          </div>

          {/* Preview + Download */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPreview();
              }}
              className="kit-icon-btn"
              title="Preview sample"
              aria-label="Preview sample PIP output"
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
            </button>
            <a
              href={SAMPLE_PDF}
              download
              className="kit-icon-btn"
              title="Download sample"
              aria-label="Download sample PIP output"
              onClick={(e) => e.stopPropagation()}
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
            </a>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewOpen && (
        <div
          className="kit-modal-backdrop"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-label="Preview: Sample PIP Output"
        >
          <div
            className="kit-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kit-modal-header">
              <span className="kit-modal-title">Sample PIP Output</span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <a
                  href={SAMPLE_PDF}
                  download
                  className="kit-modal-download"
                  title="Download"
                >
                  <svg
                    width="15"
                    height="15"
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
                  Download
                </a>
                <button
                  type="button"
                  onClick={closePreview}
                  className="kit-modal-close"
                  aria-label="Close preview"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <iframe
              src={`${SAMPLE_PDF}#toolbar=0`}
              className="kit-modal-iframe"
              title="Sample PIP Output"
            />
          </div>
        </div>
      )}
    </>
  );
}
