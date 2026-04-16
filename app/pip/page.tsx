import PIPBuilderTool from "@/components/PIPBuilderTool";
import PIPSectionCards from "@/components/PIPSectionCards";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGENT: PIP | Prompt AI Agents",
  description:
    "A PIP that holds up. Describe the performance situation, get a structured, defensible Performance Improvement Plan as a ready-to-use .docx file.",
  openGraph: {
    title: "AGENT: PIP | Prompt AI Agents",
    description:
      "A PIP that holds up. Structured, defensible, and delivered as a ready-to-use .docx file.",
    url: "https://promptaiagents.com/pip",
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
      <Nav dark />
      <main
        style={{
          background: "linear-gradient(180deg, #14151A 0%, #0A0A0C 100%)",
          minHeight: "100vh",
        }}
      >
        {/* ── Hero section ─────────────────────────────────────── */}
        <section
          className="section"
          style={{ paddingTop: "140px", paddingBottom: "20px" }}
        >
          <div className="container" style={{ textAlign: "center" }}>
            <h1
              className="heading-1"
              style={{
                margin: "0 auto 28px",
                fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                lineHeight: 1.25,
                color: "#ffffff",
              }}
            >
              A PIP That Holds Up.<br />Use for Difficult Conversations.
            </h1>

            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.55)",
                margin: "0 0 32px",
                lineHeight: 1.6,
              }}
            >
              $99 HR Package (Annual subscription)
            </p>

            <a
              href="#build-pip"
              className="btn btn-dark-cta btn-zoom"
              style={{ padding: "10px 28px", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.04em" }}
            >
              Build PIP
            </a>
          </div>
        </section>

        {/* ── What's in your PIP ───────────────────────────────── */}
        <section
          className="section dark-kit-section"
          style={{ paddingTop: "32px", paddingBottom: "40px" }}
        >
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <p style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.30)",
                marginBottom: "20px",
                textAlign: "left",
              }}>
                What's Included
              </p>
              <PIPSectionCards />
            </div>
          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section id="build-pip" className="section" style={{ paddingTop: "64px", paddingBottom: "96px", scrollMarginTop: "80px" }}>
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div className="pb-frame hero-tool-dark">
                <span className="pb-frame-label">AGENT: PIP</span>
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
