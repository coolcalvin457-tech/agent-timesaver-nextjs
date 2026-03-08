import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Guides & Resources | promptaiagents.com",
  description:
    "Practical AI guides, tutorials, and workflows for people who want to work smarter — not just talk about it.",
};

export default function GuidesPage() {
  return (
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
      <div style={{ maxWidth: "560px", width: "100%", textAlign: "center" }}>
        {/* Tool tag */}
        <div className="tool-tag" style={{ textAlign: "center", marginBottom: "24px" }}>
          promptaiagents.com
        </div>

        {/* Icon */}
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📚</div>

        <h1
          className="heading-1"
          style={{ marginBottom: "16px" }}
        >
          Guides &amp; Resources
        </h1>

        <p
          className="body-lg"
          style={{
            color: "var(--text-secondary)",
            maxWidth: "420px",
            margin: "0 auto 40px",
          }}
        >
          Practical AI tutorials and workflow guides are on the way.
          We&apos;re building them to be short, specific, and actually useful —
          no fluff.
        </p>

        {/* Coming soon card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            padding: "32px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--brand)",
              marginBottom: "12px",
            }}
          >
            Coming soon
          </div>
          <div
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
            }}
          >
            In the meantime, the best way to stay in the loop is to get your
            personalized AI workflows from the tool — then keep an eye on your
            inbox for guides tailored to your role.
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <a href="/#timesaver" className="btn btn-primary btn-full">
            Try AGENT: Timesaver →
          </a>
          <a href="/" className="btn btn-outline btn-full">
            ← Back to home
          </a>
        </div>
      </div>
    </main>
  );
}
