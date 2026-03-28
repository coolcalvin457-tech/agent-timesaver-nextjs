"use client";

import React from "react";

interface BackButtonProps {
  onClick: () => void;
}

export default function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: "var(--text-muted, #888886)",
        fontSize: "0.8125rem",
        cursor: "pointer",
        padding: "0",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        opacity: 0.7,
      }}
    >
      ← Back
    </button>
  );
}
