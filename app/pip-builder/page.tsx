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
      <main>
        {/* ── Hero section ─────────────────────────────────────── */}
        <section
          className="section section-alt"
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
                margin: "0 auto 32px",
                fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                lineHeight: 1.25,
              }}
            >
              A PIP that holds up.<br />Built for the conversation you have to have.
            </h1>

            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--text-secondary)",
                marginBottom: "12px",
                lineHeight: 1.6,
                maxWidth: "560px",
                margin: "0 auto 16px",
              }}
            >
              Specific. Measurable. Documented. A .docx file ready to review with your legal team before issuing.
            </p>

            {/* Trust line */}
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                marginBottom: "32px",
              }}
            >
              We don't store your inputs.
            </p>

            {/* Price */}
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--text-secondary)",
                marginBottom: "36px",
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 800, color: "var(--cta)", fontSize: "1.125rem" }}>$99</span>
              {" · "}
              <strong style={{ fontWeight: 600, color: "var(--text-secondary)" }}>HR Tools Package.</strong>{" "}
              <span style={{ color: "var(--text-muted)" }}>Annual subscription. Includes all HR tools.</span>
            </p>

            <a
              href="#build-pip"
              className="btn btn-primary"
              style={{ padding: "10px 24px", fontSize: "0.9375rem", borderRadius: "6px" }}
            >
              Build My PIP
            </a>

            {/* Opens in */}
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                marginTop: "16px",
              }}
            >
              Opens in Microsoft Word or Google Docs.
            </p>
          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section id="build-pip" className="section" style={{ paddingTop: "64px" }}>
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <p className="eyebrow" style={{ marginBottom: "20px" }}>
                AGENT: PIP Builder
              </p>
              <PIPBuilderTool
                initialPaymentStatus={searchParams.payment}
                initialSessionId={searchParams.session_id}
              />
            </div>
          </div>
        </section>

        {/* ── Bundle callout ────────────────────────────────────── */}
        <section className="section" style={{ paddingTop: "32px", paddingBottom: "80px" }}>
          <div className="container">
            <div
              style={{
                maxWidth: "760px",
                margin: "0 auto",
                padding: "24px 28px",
                background: "var(--bg-alt, #F8F8F6)",
                border: "1px solid var(--border, #E4E4E2)",
                borderRadius: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--cta)",
                  margin: "0 0 16px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Part of the HR Tools Package
              </p>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-secondary)",
                  margin: "0 0 16px",
                  lineHeight: 1.7,
                }}
              >
                This tool is part of the HR Tools Package. One purchase includes both PIP Builder and AGENT: Onboarding Kit — position-specific onboarding kits for every new hire.
              </p>
              <a
                href="/onboarding-kit-builder"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--cta)",
                  textDecoration: "none",
                }}
              >
                See AGENT: Onboarding Kit →
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
