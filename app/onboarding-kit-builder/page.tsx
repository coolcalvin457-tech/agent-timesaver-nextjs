import OnboardingKitBuilderTool from "@/components/OnboardingKitBuilderTool";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGENT: Onboarding Kit Builder — promptaiagents.com",
  description:
    "Build a position-specific onboarding kit for every new hire. Welcome letter, first-week schedule, key contacts, 30/60/90 plan, and priority checklist — as a ready-to-use .docx file.",
  openGraph: {
    title: "AGENT: Onboarding Kit Builder — promptaiagents.com",
    description:
      "Build a position-specific onboarding kit for every new hire. Delivered as a ready-to-use .docx file.",
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
          style={{ paddingTop: "120px", paddingBottom: "0" }}
        >
          <div className="container-narrow">
            {/* Badge */}
            <div style={{ marginBottom: "16px" }}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-tag)",
                  background: "rgba(30, 122, 184, 0.08)",
                  color: "var(--cta)",
                }}
              >
                HR Tools
              </span>
            </div>

            <h1
              className="heading-1"
              style={{ marginBottom: "16px", maxWidth: "600px" }}
            >
              Build a position-specific onboarding kit for every new hire.
            </h1>

            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "520px",
                marginBottom: "20px",
                lineHeight: 1.7,
              }}
            >
              Includes warm welcome letter, first-week schedule, key contacts, 30/60/90 plan, and priority checklist.
            </p>

            {/* Pricing callout — links to tool form */}
            <a
              href="#build-kit"
              className="pricing-callout-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 20px",
                background: "rgba(30,122,184,0.06)",
                border: "1px solid rgba(30,122,184,0.15)",
                borderRadius: "8px",
                marginBottom: "24px",
                textDecoration: "none",
                transition: "background 0.15s ease, border-color 0.15s ease",
              }}
            >
              <span
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 800,
                  color: "var(--cta)",
                  lineHeight: 1,
                }}
              >
                $49
              </span>
              <span
                style={{
                  width: "1px",
                  height: "16px",
                  background: "var(--border, #E4E4E2)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                <strong style={{ fontWeight: 600 }}>Founding rate.</strong>{" "}
                <span style={{ color: "var(--text-muted)" }}>
                  $97 at full launch · One-time purchase.
                </span>
              </span>
            </a>
          </div>
        </section>

        {/* ── What's in the kit ─────────────────────────────────── */}
        <section className="section section-alt" style={{ paddingTop: "32px", paddingBottom: "64px" }}>
          <div className="container-narrow">
            <h2
              className="heading-2"
              style={{ marginBottom: "32px" }}
            >
              Preview Examples:
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "16px",
                marginBottom: "40px",
              }}
            >
              {[
                { title: "Warm Welcome Letter",  pdf: "/kit-samples/warm-welcome-letter.pdf" },
                { title: "First-Week Schedule",   pdf: "/kit-samples/first-week-schedule.pdf" },
                { title: "Key Contacts",          pdf: "/kit-samples/key-contacts.pdf" },
                { title: "30-60-90 Day Plan",     pdf: "/kit-samples/30-60-90-day-plan.pdf" },
                { title: "New Hire Checklist",    pdf: "/kit-samples/new-hire-checklist.pdf" },
                { title: "Complete Kit",           pdf: "/kit-samples/onboarding-kit-sample.pdf" },
              ].map((item) => (
                <a
                  key={item.title}
                  href={item.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kit-sample-card"
                >
                  <h3
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "16px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--cta)",
                    }}
                  >
                    Preview →
                  </span>
                </a>
              ))}
            </div>

            {/* CTA after previews */}
            <div style={{ textAlign: "center", paddingTop: "8px" }}>
              <a
                href="#build-kit"
                className="btn btn-primary"
                style={{ display: "inline-block", padding: "14px 32px", fontSize: "1rem" }}
              >
                Build My Kit →
              </a>
            </div>
          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section id="build-kit" className="section" style={{ paddingTop: "64px" }}>
          <div className="container">
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
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
