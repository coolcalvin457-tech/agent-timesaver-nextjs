"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";

export default function PromptBuilderEmbed() {
  const [jobTitle, setJobTitle] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    if (!jobTitle.trim()) return;
    track("prompt_builder_embed_start", { jobTitle });
    router.push(`/prompt-builder?jobTitle=${encodeURIComponent(jobTitle.trim())}`);
  };

  return (
    <div className="browser-chrome hero-tool-dark" style={{ maxWidth: "540px", margin: "0 auto" }}>
      <div className="browser-bar">
        <div className="browser-dot browser-dot-red" />
        <div className="browser-dot browser-dot-yellow" />
        <div className="browser-dot browser-dot-green" />
        <div className="browser-url">promptaiagents.com/prompt-builder</div>
      </div>
      <div style={{ padding: "32px 28px 28px" }}>
        <span style={{
          fontSize: "0.6875rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
          color: "var(--cta)",
          textTransform: "uppercase" as const,
          display: "block",
          marginBottom: "20px",
        }}>
          AGENT: Prompt Builder
        </span>
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
          fontWeight: 400,
          color: "#fff",
          lineHeight: 1.25,
          marginBottom: "20px",
        }}>
          What&apos;s your job title?
        </p>
        <input
          type="text"
          className="input"
          placeholder="e.g. Marketing Manager, HR Business Partner..."
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && jobTitle.trim()) handleSubmit(); }}
          style={{ marginBottom: "16px" }}
        />
        <button
          className="btn btn-primary btn-full"
          onClick={handleSubmit}
          disabled={!jobTitle.trim()}
        >
          Build My Prompts
        </button>
      </div>
    </div>
  );
}
