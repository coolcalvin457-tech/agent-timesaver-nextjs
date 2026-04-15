"use client";

import React, { useState, useEffect, useCallback } from "react";

// ─── Deliverable names (canonical, from tool config) ─────────────────────────

const DELIVERABLES = [
  { title: "Welcome Letter" },
  { title: "First-Week Schedule" },
  { title: "Key Contacts" },
  { title: "30-60-90 Day Plan" },
  { title: "New Hire Checklist" },
];

const SAMPLE_PDF = "/kit-samples/onboarding-kit-sample.pdf";

// ─── Component ───────────────────────────────────────────────────────────────

export default function KitPreviewCards() {
  const [previewOpen, setPreviewOpen] = useState(false);

  const openPreview = () => setPreviewOpen(true);
  const closePreview = useCallback(() => setPreviewOpen(false), []);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePreview(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewOpen, closePreview]);

  useEffect(() => {
    document.body.style.overflow = previewOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [previewOpen]);

  return (
    <>
      {/* ── List ── */}
      <div className="kit-list">
        {/* Deliverable name rows (text-only, non-clickable) */}
        {DELIVERABLES.map((section) => (
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

        {/* Featured: Example row */}
        <div
          className="kit-list-row kit-list-row-featured"
          onClick={openPreview}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openPreview(); }}
          aria-label="Preview example Onboarding Kit output"
          style={{ position: "relative" }}
        >
          {/* Document thumbnail */}
          <div className="kit-list-thumb">
            <img
              src="/kit-thumbnails/onboarding-kit-sample.png"
              alt=""
              aria-hidden="true"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top left",
                display: "block",
              }}
            />
          </div>

          {/* Badge absolutely centered in the card */}
          <span className="kit-list-badge" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>Example</span>

          {/* Spacer to keep icons pushed right */}
          <div style={{ flex: 1 }} />

          {/* Preview + Download */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openPreview(); }}
              className="kit-icon-btn"
              title="Preview sample"
              aria-label="Preview sample Onboarding Kit output"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <a
              href={SAMPLE_PDF}
              download
              className="kit-icon-btn"
              title="Download sample"
              aria-label="Download sample Onboarding Kit output"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ── PDF Preview Modal ── */}
      {previewOpen && (
        <div
          className="kit-modal-backdrop"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-label="Preview: Example Onboarding Kit Output"
        >
          <div
            className="kit-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kit-modal-header">
              <span className="kit-modal-title">Example Onboarding Kit Output</span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <a
                  href={SAMPLE_PDF}
                  download
                  className="kit-modal-download"
                  title="Download"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
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
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <iframe
              src={`${SAMPLE_PDF}#toolbar=0`}
              className="kit-modal-iframe"
              title="Example Onboarding Kit Output"
            />
          </div>
        </div>
      )}
    </>
  );
}
