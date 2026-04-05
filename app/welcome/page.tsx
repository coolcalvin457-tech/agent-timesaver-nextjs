import type { Metadata } from "next";
import Footer from "@/components/Footer";

// ── Update these URLs when your community and guides are live ──────────────
const COMMUNITY_URL = "https://www.skool.com"; // TODO: replace with your Skool community link
const GUIDES_URL = "/guides";
// ──────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "You're in — AGENT: Timesaver | Prompt AI Agents",
  description:
    "Your personalized AI workflows are on their way. Here's where to go next.",
};

export default function WelcomePage() {
  return (
    <>
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "var(--bg)",
      }}
    >
      <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>
        {/* Eyebrow */}
        <div className="eyebrow" style={{ textAlign: "center", marginBottom: "12px" }}>
          AGENT: Timesaver
        </div>

        {/* Confirmation */}
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>✅</div>
        <h1
          className="heading-1"
          style={{ marginBottom: "12px" }}
        >
          You&apos;re in.
        </h1>
        <p
          className="body-lg"
          style={{
            color: "var(--text-secondary)",
            marginBottom: "40px",
            maxWidth: "400px",
            margin: "0 auto 40px",
          }}
        >
          Check your inbox — your results and full workflow breakdown are on
          their way. Here&apos;s where to go next.
        </p>

        {/* Next steps */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "36px",
          }}
        >
          {[
            { num: 1, label: "Community — coming soon", href: null },
            { num: 2, label: "Browse the hub and start with our beginner AI guide", href: GUIDES_URL },
            { num: 3, label: "Try another agent when you're ready", href: "/" },
          ].map((step) =>
            step.href ? (
              <a
                key={step.num}
                href={step.href}
                className="next-step"
                style={{ textDecoration: "none" }}
              >
                <span className="step-num">{step.num}</span>
                {step.label}
              </a>
            ) : (
              <div key={step.num} className="next-step next-step-disabled">
                <span className="step-num">{step.num}</span>
                {step.label}
              </div>
            )
          )}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <a href={GUIDES_URL} className="btn btn-primary btn-full">
            Browse the Hub →
          </a>
        </div>

        {/* Back to home */}
        <a
          href="/"
          style={{
            display: "block",
            marginTop: "24px",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          ← Back to Prompt AI Agents
        </a>
      </div>
    </main>
    <Footer />
    </>
  );
}
