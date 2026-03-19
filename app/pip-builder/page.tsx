import PIPBuilderTool from "@/components/PIPBuilderTool";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGENT: PIP Builder — Prompt AI Agents",
  description:
    "A PIP that holds up. Describe the performance situation, get a structured, defensible Performance Improvement Plan as a ready-to-use .docx file.",
  openGraph: {
    title: "AGENT: PIP Builder — Prompt AI Agents",
    description:
      "A PIP that holds up. Structured, defensible, and delivered as a ready-to-use .docx file.",
    url: "https://promptaiagents.com/pip-builder",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

export default function PIPBuilderPage({
  searchParams,
}: {
  searchParams: { payment?: string; session_id?: string };
}) {
  return (
    <>
      <NavClient />
      <main
        style={{
          background: "linear-gradient(180deg, #1A1B22 0%, #0E0E10 100%)",
          minHeight: "100vh",
        }}
      >
        {/* ── Hero section ─────────────────────────────────────── */}
        <section
          className="section"
          style={{ paddingTop: "140px", paddingBottom: "40px" }}
        >
          <div className="container" style={{ textAlign: "center" }}>
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
              HR Tools
            </p>

            <h1
              className="heading-1"
              style={{
                margin: "0 auto 24px",
                fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                lineHeight: 1.25,
                color: "#ffffff",
              }}
            >
              A PIP That Holds Up.<br />Built for the Conversation You Have to Have.
            </h1>

            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.55)",
                marginBottom: "12px",
                lineHeight: 1.6,
                maxWidth: "560px",
                margin: "0 auto 16px",
              }}
            >
              Specific. Measurable. Documented. A .docx file ready to review with your legal team before issuing.
            </p>

            <p
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "28px",
              }}
            >
              We don't store your inputs.
            </p>

            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.55)",
                marginBottom: "36px",
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 800, color: "var(--cta)", fontSize: "1.125rem" }}>$99</span>
              {" · "}
              <strong style={{ fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>HR Tools Package.</strong>{" "}
              Annual subscription.
            </p>

            <a
              href="#build-pip"
              className="btn btn-primary"
              style={{ padding: "10px 24px", fontSize: "0.9375rem", borderRadius: "6px" }}
            >
              Build My PIP
            </a>

            <p
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.30)",
                marginTop: "16px",
              }}
            >
              Opens in Microsoft Word or Google Docs.
            </p>
          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section id="build-pip" className="section" style={{ paddingTop: "48px", paddingBottom: "96px" }}>
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div className="pb-frame hero-tool-dark" style={{ maxWidth: "760px" }}>
                <span className="pb-frame-label">AGENT: PIP Builder</span>
                <div className="pb-frame-body">
                  <PIPBuilderTool
                    initialPaymentStatus={searchParams.payment}
                    initialSessionId={searchParams.session_id}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
