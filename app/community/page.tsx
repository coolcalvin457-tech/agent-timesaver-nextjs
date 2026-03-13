import type { Metadata } from "next";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";

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
              A place where professionals share what&apos;s working with AI.
              Real-life, applicable examples.
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
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--brand)",
              }}
            >
              Coming Soon
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <a href="/#timesaver" className="btn btn-primary btn-full">
              Try AGENT: Timesaver →
            </a>
            <a href="/" className="btn btn-outline btn-full">
              Back to homepage
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
