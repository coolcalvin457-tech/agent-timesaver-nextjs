import OnboardingKitBuilderTool from "@/components/OnboardingKitBuilderTool";
import KitPreviewCards from "@/components/KitPreviewCards";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGENT: Onboarding Kit Builder — promptaiagents.com",
  description:
    "A position-specific onboarding kit for every new hire. Welcome letter, first-week schedule, key contacts, 30/60/90 plan, and priority checklist — as a ready-to-use .docx file.",
  openGraph: {
    title: "AGENT: Onboarding Kit Builder — promptaiagents.com",
    description:
      "A position-specific onboarding kit for every new hire. Delivered as a ready-to-use .docx file.",
    url: "https://promptaiagents.com/onboarding-kit-builder",
    siteName: "promptaiagents.com",
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
      <main>
        {/* ── Hero section ─────────────────────────────────────── */}
        <section
          className="section section-alt"
          style={{ paddingTop: "140px", paddingBottom: "56px" }}
        >
          <div className="container" style={{ textAlign: "center" }}>
            {/* HR Tools — plain label, no badge */}
            {/* HR Tools — light blue label */}
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
                margin: "0 auto 20px",
                fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
              }}
            >
              A position-specific onboarding<br />kit for every new hire.
            </h1>

            {/* Price — plain subheader text, no button */}
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--text-secondary)",
                marginBottom: "28px",
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 800, color: "var(--cta)", fontSize: "1.125rem" }}>$49</span>
              {" · "}
              <strong style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Founding rate.</strong>{" "}
              <span style={{ color: "var(--text-muted)" }}>$97 at full launch · One-time purchase.</span>
            </p>

            {/* Single CTA — matches nav button size */}
            <a
              href="#build-kit"
              className="btn btn-primary"
              style={{ padding: "10px 24px", fontSize: "0.9375rem", borderRadius: "6px" }}
            >
              Build My Kit →
            </a>
          </div>
        </section>

        {/* ── What's in the kit ─────────────────────────────────── */}
        <section className="section" style={{ background: "#ffffff", paddingTop: "80px", paddingBottom: "96px" }}>
          <div className="container">
            <div
              style={{
                maxWidth: "960px",
                margin: "0 auto",
              }}
            >
            <KitPreviewCards />
            </div>
          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section id="build-kit" className="section" style={{ paddingTop: "96px" }}>
          <div className="container">
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
              {/* Tool label */}
              <p
                className="eyebrow"
                style={{ marginBottom: "20px" }}
              >
                AGENT: Onboarding Kit Builder
              </p>
              <OnboardingKitBuilderTool
                initialPaymentStatus={searchParams.payment}
                initialSessionId={searchParams.session_id}
              />
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
