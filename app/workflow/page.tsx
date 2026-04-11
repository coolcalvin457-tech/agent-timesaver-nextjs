import WorkflowBuilderTool from "@/components/WorkflowBuilderTool";
import WorkflowSectionCards from "@/components/WorkflowSectionCards";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGENT: Workflow — Prompt AI Agents",
  description:
    "Describe a task you want to do better with AI. Get a step-by-step workflow doc: what tools to use, in what order, with the actual prompts to run each step.",
  openGraph: {
    title: "AGENT: Workflow — Prompt AI Agents",
    description:
      "Describe a task. Get the exact playbook to get it done with AI. Step-by-step workflow delivered as a ready-to-use .docx file.",
    url: "https://promptaiagents.com/workflow",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

export default function WorkflowBuilderPage({
  searchParams,
}: {
  searchParams: { payment?: string; session_id?: string };
}) {
  return (
    <>
      <Nav dark />
      <main
        style={{
          background: "linear-gradient(180deg, #1A1B22 0%, #0E0E10 100%)",
          minHeight: "100vh",
        }}
      >
        {/* ── Hero section ──────────────────────────────────── */}
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
              You Have a Task.<br />We&apos;ll Build the Workflow.
            </h1>

            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.45)",
                margin: "0 0 32px",
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 800, color: "var(--cta)", fontSize: "1.125rem" }}>$49</span>
              {" · "}
              <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.65)" }}>Annual subscription</span>
            </p>

            <a
              href="#build-workflow"
              className="btn btn-dark-cta btn-zoom"
              style={{ padding: "10px 28px", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.04em" }}
            >
              Build Workflow
            </a>
          </div>
        </section>

        {/* ── What's Included section ────────────────────────── */}
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
                What&apos;s Included
              </p>
              <WorkflowSectionCards />
            </div>
          </div>
        </section>

        {/* ── Tool section ───────────────────────────────────── */}
        <section id="build-workflow" className="section" style={{ paddingTop: "64px", paddingBottom: "96px", scrollMarginTop: "20px" }}>
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div className="pb-frame hero-tool-dark" style={{ maxWidth: "760px" }}>
                <span className="pb-frame-label">AGENT: Workflow</span>
                <div className="pb-frame-body">
                  <WorkflowBuilderTool
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
