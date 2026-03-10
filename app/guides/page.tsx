import type { Metadata } from "next";
import NavClient from "@/components/NavClient";

export const metadata: Metadata = {
  title: "Resources | promptaiagents.com",
  description:
    "Practical AI guides, tutorials, and workflows for people who want to work smarter — not just talk about it.",
};

export default function GuidesPage() {
  return (
    <>
      <NavClient />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
        }}
      >
        <div className="container-narrow">
          <div style={{ paddingTop: "40px", marginBottom: "64px" }}>
            <h1 className="heading-1" style={{ marginBottom: "14px" }}>
              Resources
            </h1>
            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "480px",
              }}
            >
              Practical AI tutorials and workflow guides are on the way.
              We&apos;re building them to be short, specific, and actually useful —
              no fluff.
            </p>
          </div>

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
    </>
  );
}
