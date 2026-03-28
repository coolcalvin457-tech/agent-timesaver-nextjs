"use client";

import React from "react";

interface StepIndicatorProps {
  current: number;
  total: number;
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", gap: "5px", marginBottom: "28px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "3px",
            borderRadius: "2px",
            background: i < current ? "var(--cta, #1E7AB8)" : "var(--border, #E4E4E2)",
            transition: "background 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}
