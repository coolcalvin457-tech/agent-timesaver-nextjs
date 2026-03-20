"use client";

import { useState, useEffect, useCallback } from "react";

const KIT_ITEMS = [
  { title: "Warm Welcome Letter",  pdf: "/kit-samples/warm-welcome-letter.pdf",     thumb: "/kit-thumbnails/warm-welcome-letter.png" },
  { title: "First-Week Schedule",  pdf: "/kit-samples/first-week-schedule.pdf",     thumb: "/kit-thumbnails/first-week-schedule.png" },
  { title: "Key Contacts",         pdf: "/kit-samples/key-contacts.pdf",            thumb: "/kit-thumbnails/key-contacts.png" },
  { title: "30-60-90 Day Plan",    pdf: "/kit-samples/30-60-90-day-plan.pdf",       thumb: "/kit-thumbnails/30-60-90-day-plan.png" },
  { title: "New Hire Checklist",   pdf: "/kit-samples/new-hire-checklist.pdf",      thumb: "/kit-thumbnails/new-hire-checklist.png" },
  { title: "Complete Kit",         pdf: "/kit-samples/onboarding-kit-sample.pdf",   thumb: "/kit-thumbnails/onboarding-kit-sample.png", featured: true },
];

export default function KitPreviewCards() {
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const openPreview = (pdf: string, title: string) => {
    setPreviewPdf(pdf);
    setPreviewTitle(title);
  };

  const closePreview = useCallback(() => {
    setPreviewPdf(null);
    setPreviewTitle("");
  }, []);

  useEffect(() => {
    if (!previewPdf) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePreview(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewPdf, closePreview]);

  useEffect(() => {
    document.body.style.overflow = previewPdf ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [previewPdf]);

  return (
    <>
      {/* ── List ── */}
      <div className="kit-list">
        {KIT_ITEMS.map((item, index) => (
          <div
            key={item.title}
            className={`kit-list-row${item.featured ? " kit-list-row-featured" : ""}`}
            onClick={() => openPreview(item.pdf, item.title)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openPreview(item.pdf, item.title); }}
            aria-label={`Preview ${item.title}`}
            style={{}}
          >
            {/* Small thumbnail */}
            <div className="kit-list-thumb">
              <img
                src={item.thumb}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top",
                  display: "block",
                }}
              />
            </div>

            {/* Title + badge */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span className="kit-list-title">{item.title}</span>
              {item.featured && (
                <span className="kit-list-badge">Full Kit</span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openPreview(item.pdf, item.title); }}
                className="kit-icon-btn"
                title="Preview"
                aria-label={`Preview ${item.title}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
              <a
                href={item.pdf}
                download
                className="kit-icon-btn"
                title="Download"
                aria-label={`Download ${item.title}`}
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ── PDF Preview Modal ── */}
      {previewPdf && (
        <div
          className="kit-modal-backdrop"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-label={`Preview: ${previewTitle}`}
        >
          <div
            className="kit-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kit-modal-header">
              <span className="kit-modal-title">{previewTitle}</span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <a
                  href={previewPdf}
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
              src={`${previewPdf}#toolbar=0`}
              className="kit-modal-iframe"
              title={previewTitle}
            />
          </div>
        </div>
      )}
    </>
  );
}
