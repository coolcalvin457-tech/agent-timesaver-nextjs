"use client";

import React from "react";

interface QualitySignalProps {
  value: string;
  message?: string;
}

/**
 * Positive reinforcement signal. Appears only when the user has typed
 * 150+ characters into a detail-heavy textarea.
 */
export default function QualitySignal({
  value,
  message = "Good detail. Your results will reflect this.",
}: QualitySignalProps) {
  if (value.trim().length < 150) return null;

  return (
    <p
      style={{
        margin: "6px 0 0",
        fontSize: "0.8125rem",
        color: "var(--success, #1A7A4A)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      ✓ {message}
    </p>
  );
}
