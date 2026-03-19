import OnboardingKitBuilderTool from "@/components/OnboardingKitBuilderTool";
import KitPreviewCards from "@/components/KitPreviewCards";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGENT: Onboarding Kit — Prompt AI Agents",
  description:
    "A position-specific onboarding kit for every new hire. Welcome letter, first-week schedule, key contacts, 30/60/90 plan, and priority checklist — as a ready-to-use .docx file.",
  openGraph: {
    title: "AGENT: Onboarding Kit — Prompt AI Agents",
    description:
      "A position-specific onboarding kit for every new hire. Delivered as a ready-to-use .docx file.",
    url: "https://promptaiagents.com/onboarding-kit-builder",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

export default function OnboardingKitBuilderPage({
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
                margin: "0 auto 32px",
                fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                lineHeight: 1.25,
                color: "#ffffff",
              }}
            >
              Position-specific onboarding kit.<br />Use for every new hire.
            </h1>

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
              <span>Annual subscription. Includes all HR tools.</span>
            </p>

            <a
              href="#build-kit"
              className="btn btn-primary"
              style={{ padding: "10px 24px", fontSize: "0.9375rem", borderRadius: "6px" }}
            >
              Build My Kit
            </a>
          </div>
        </section>

        {/* ── What's in the kit ─────────────────────────────────── */}
        <section
          className="section dark-kit-section"
          style={{ paddingTop: "80px", paddingBottom: "64px" }}
        >
          <div className="container">
            <div style={{ maxWidth: "960px", margin: "0 auto" }}>
              <KitPreviewCards />
            </div>
          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section id="build-kit" className="section" style={{ paddingTop: "64px", paddingBottom: "96px" }}>
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div className="pb-frame hero-tool-dark" style={{ maxWidth: "760px" }}>
                <span className="pb-frame-label">AGENT: Onboarding Kit</span>
                <div className="pb-frame-body">
                  <OnboardingKitBuilderTool
                    initialPaymentStatus={searchParams.payment}
                    initialSessionId={searchParams.session_id}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bundle callout ────────────────────────────────────── */}
        <section className="section" style={{ paddingTop: "0", paddingBottom: "80px" }}>
          <div className="container">
            <div
              style={{
                maxWidth: "760px",
                margin: "0 auto",
                padding: "24px 28px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--cta)",
                  margin: "0 0 12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Part of the HR Tools Package
              </p>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.60)",
                  margin: "0 0 14px",
                  lineHeight: 1.7,
                }}
              >
                This tool is part of the HR Tools Package. One purchase includes both Onboarding Kit and AGENT: PIP Builder — structured, defensible Performance Improvement Plans as a ready-to-use .docx file.
              </p>
              <a
                href="/pip-builder"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--cta)",
                  textDecoration: "none",
                }}
              >
                See AGENT: PIP Builder →
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
