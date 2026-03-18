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
      <main style={{ background: "linear-gradient(180deg, #1A1B22 0%, #0E0E10 100%)", minHeight: "100vh" }}>
        {/* ── Hero section ─────────────────────────────────────── */}
        <section
          className="section"
          style={{ paddingTop: "120px", paddingBottom: "24px" }}
        >
          <div className="container" style={{ textAlign: "center" }}>

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
                margin: "0 auto 0",
                fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                lineHeight: 1.25,
                color: "#ffffff",
              }}
            >
              12 prompts built for your exact job.
            </h1>

          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section className="section" style={{ paddingTop: "40px" }}>
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div className="hero-tool-dark">
                <PromptBuilderTool />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
