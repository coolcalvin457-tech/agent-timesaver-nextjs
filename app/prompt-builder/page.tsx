import PromptBuilderTool from "@/components/PromptBuilderTool";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";

export const metadata = {
  title: "AGENT: Prompt Builder — Prompt AI Agents",
  description:
    "Get 12 ready-to-copy AI prompts personalized to your exact job. Built for non-technical professionals who want real results from AI.",
};

export default function PromptBuilderPage() {
  return (
    <>
      <NavClient />
      <main>
        {/* ── Hero section ─────────────────────────────────────── */}
        <section
          className="section section-alt"
          style={{ paddingTop: "140px", paddingBottom: "40px" }}
        >
          <div className="container" style={{ textAlign: "center" }}>

            {/* Back to Tools — breadcrumb nav */}
            <div style={{ textAlign: "left", marginBottom: "48px" }}>
              <a
                href="/tools"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                }}
              >
                ← Back to Tools
              </a>
            </div>

            {/* Eyebrow */}
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--cta)",
                marginBottom: "20px",
              }}
            >
              AGENT: Prompt Builder
            </p>

            {/* Headline */}
            <h1
              className="heading-1"
              style={{
                margin: "0 auto 32px",
                fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                lineHeight: 1.25,
              }}
            >
              12 prompts built for your exact job.
            </h1>

            {/* CTA */}
            <a
              href="#build-prompt-kit"
              className="btn btn-primary"
              style={{ padding: "10px 24px", fontSize: "0.9375rem", borderRadius: "6px" }}
            >
              Build My Prompt Kit
            </a>

          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section id="build-prompt-kit" className="section" style={{ paddingTop: "64px" }}>
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <p className="eyebrow" style={{ marginBottom: "20px" }}>
                AGENT: Prompt Builder
              </p>
              <PromptBuilderTool />
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
