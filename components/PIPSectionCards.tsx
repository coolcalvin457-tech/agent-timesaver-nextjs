"use client";

import React, { useState, useEffect, useCallback } from "react";

const PIP_SECTIONS = [
  { title: "Opening Statement" },
  { title: "Performance Deficiencies" },
  { title: "Improvement Targets" },
  { title: "Support & Resources" },
  { title: "Accountability Plan" },
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
            onClick={openPreview}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openPreview(); }}
            aria-label={`Preview ${section.title} in sample output`}
          >
            {/* Doc icon thumbnail */}
            <div className="kit-list-thumb">
              <svg width="100%" height="100%" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="48" rx="3" fill="rgba(255,255,255,0.06)" />
                <line x1="8" y1="14" x2="32" y2="14" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="20" x2="32" y2="20" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="26" x2="32" y2="26" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="32" x2="22" y2="32" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="kit-list-title">{section.title}</span>
            </div>

            {/* Icons */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openPreview(); }}
                className="kit-icon-btn"
                title="Preview"
                aria-label={`Preview ${section.title}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <a
                href={SAMPLE_PDF}
                download
                className="kit-icon-btn"
                title="Download sample"
                aria-label={`Download sample PIP`}
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
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
