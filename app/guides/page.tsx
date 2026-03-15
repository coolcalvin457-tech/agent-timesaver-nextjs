import type { Metadata } from "next";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Resources | promptaiagents.com",
  description:
    "Practical AI guides, tutorials, and workflows for people who want to work smarter. Built for real jobs. Not demos.",
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
        <div className="container">
          <div style={{ paddingTop: "80px", marginBottom: "40px", textAlign: "center" }}>
            <h1 className="heading-1" style={{ marginBottom: "14px", fontSize: "clamp(2.75rem, 6vw, 4.5rem)", lineHeight: 1.05 }}>
              Resources
            </h1>
            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                margin: "0 auto",
              }}
            >
              Built for real jobs. Not demos.
            </p>
          </div>
        </div>

        <div className="container-narrow">
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
              Try AGENT: Timesaver
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