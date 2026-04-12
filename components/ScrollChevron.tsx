"use client";

export default function ScrollChevron() {
  return (
    <button
      type="button"
      aria-label="Scroll to Start Here"
      onClick={() => document.getElementById('prompts')?.scrollIntoView({ behavior: 'smooth' })}
      style={{ background: "none", border: "none", padding: "8px", cursor: "pointer", display: "block", margin: "28px auto 0" }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        style={{ display: "block", opacity: 0.4, animation: "gentleBounce 2.4s ease-in-out infinite" }}
      >
        <path d="M6 9l6 6 6-6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
