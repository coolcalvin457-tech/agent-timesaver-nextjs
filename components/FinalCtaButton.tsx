"use client";

export default function FinalCtaButton() {
  return (
    <a
      href="/agents"
      style={{
        display: "inline-block",
        padding: "9px 24px",
        fontSize: "0.8125rem",
        fontWeight: 400,
        letterSpacing: "0.01em",
        color: "#FFFFFF",
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: "100px",
        textDecoration: "none",
        transition: "all 0.25s ease",
        transform: "scale(1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.transform = "scale(1.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      Let&apos;s Go
    </a>
  );
}
