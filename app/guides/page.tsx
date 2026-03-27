import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Resources | Prompt AI Agents",
  description:
    "Practical AI guides, tutorials, and workflows for people who want to work smarter. Built for real jobs. Not demos.",
};

export default function GuidesPage() {
  return (
    <>
      <Nav />
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
              className="hero-subheadline"
              style={{ margin: "0 auto" }}
            >
              Built for real jobs. Not demos.
            </p>
          </div>
        </div>

        <div className="container-narrow">
          {/* Guide card */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "48px" }}>
            <a
              href="/guides/cafe-framework-guide.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="blog-card"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span className="blog-tag">Free Guide</span>
                <span className="caption" style={{ color: "var(--text-muted)" }}>
                  March 2026
                </span>
                <span className="caption" style={{ color: "var(--text-muted)" }}>
                  · 2 pages
                </span>
              </div>
              <h2
                className="heading-2"
                style={{ marginBottom: "12px", color: "var(--text-primary)" }}
              >
                The CAFE Framework
              </h2>
              <p
                className="body"
                style={{
                  color: "var(--text-secondary)",
                  marginBottom: "20px",
                  lineHeight: 1.7,
                }}
              >
                A four-part structure for writing prompts that get real answers.
                <br />
                Context. Ask. Format. Effect.
              </p>
              <span
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "var(--cta)",
                }}
              >
                Download PDF →
              </span>
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}