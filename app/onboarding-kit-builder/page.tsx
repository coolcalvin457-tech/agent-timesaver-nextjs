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
              Position-Specific Onboarding Kit.<br />Use for Every New Hire.
            </h1>

            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.52)",
                margin: "0 0 32px",
                lineHeight: 1.6,
                fontWeight: 400,
                letterSpacing: "0.02em",
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--cta)", fontSize: "1.0625rem" }}>$99</span>
              {" · "}
              HR Tools Package. Annual subscription.
            </p>

            <a
              href="#build-kit"
              className="btn btn-dark-cta btn-zoom"
              style={{ padding: "11px 36px", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.04em" }}
            >
              Build Kit
            </a>
          </div>
        </section>

        {/* ── What's in the kit ─────────────────────────────────── */}
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
                What's included
              </p>
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

      </main>
      <Footer />
    </>
  );
}
