"use client";

export default function FinalCtaButton() {
  return (
    <a
      href="/agents"
      style={{
        display: "inline-block",
        padding: "12px 32px",
        fontSize: "0.875rem",
        fontWeight: 500,
        letterSpacing: "0.01em",
        color: "#FFFFFF",
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: "100px",
        textDecoration: "none",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "transparent"; }}
    >
      Get Started
    </a>
  );
}
