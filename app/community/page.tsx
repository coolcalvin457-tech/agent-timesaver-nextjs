import type { Metadata } from "next";
import NavClient from "@/components/NavClient";

export const metadata: Metadata = {
  title: "Community | promptaiagents.com",
  description:
    "A place to learn alongside other non-technical professionals who are figuring out AI at work. Coming soon.",
};

export default function CommunityPage() {
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
              Community
            </h1>
            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "480px",
              }}
            >
              A place to ask questions, share wins, and learn alongside other
              professionals figuring out AI at work. We&apos;re building it the
              right way.
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
              In the meantime, start with the free tools and get your first
              AI workflows built. The community will be here when you&apos;re
              ready to go deeper.
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
