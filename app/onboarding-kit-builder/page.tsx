import OnboardingKitBuilderTool from "@/components/OnboardingKitBuilderTool";
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
          style={{ paddingTop: "120px", paddingBottom: "72px" }}
        >
          <div className="container">
            {/* Badge */}
            <div style={{ marginBottom: "14px" }}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "3px 9px",
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
              style={{ marginBottom: "32px", maxWidth: "680px" }}
            >
              A position-specific onboarding kit for every new hire.
            </h1>

            {/* Pricing callout + CTA row */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              {/* Pricing callout */}
              <a
                href="#build-kit"
                className="pricing-callout-link"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 14px",
                  background: "rgba(30,122,184,0.06)",
                  border: "1px solid rgba(30,122,184,0.15)",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "background 0.15s ease, border-color 0.15s ease",
                }}
              >
                <span
                  style={{
                    fontSize: "1.125rem",
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
                    height: "14px",
                    background: "var(--border, #E4E4E2)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 600 }}>Founding rate.</strong>{" "}
                  <span style={{ color: "var(--text-muted)" }}>
                    $97 at full launch · One-time purchase.
                  </span>
                </span>
              </a>

              {/* Primary CTA */}
              <a
                href="#build-kit"
                className="btn btn-primary"
                style={{ padding: "10px 28px", fontSize: "0.9375rem" }}
              >
                Build My Kit →
              </a>
            </div>
          </div>
        </section>

        {/* ── What's in the kit ─────────────────────────────────── */}
        <section className="section section-alt" style={{ paddingTop: "80px", paddingBottom: "96px" }}>
          <div className="container">
            <h2
              className="heading-2"
              style={{ marginBottom: "40px", maxWidth: "640px" }}
            >
              Preview Examples:
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "24px",
                marginBottom: "56px",
              }}
            >
              {[
                { title: "Warm Welcome Letter",  pdf: "/kit-samples/warm-welcome-letter.pdf",      thumb: "/kit-thumbnails/warm-welcome-letter.png" },
                { title: "First-Week Schedule",   pdf: "/kit-samples/first-week-schedule.pdf",       thumb: "/kit-thumbnails/first-week-schedule.png" },
                { title: "Key Contacts",          pdf: "/kit-samples/key-contacts.pdf",              thumb: "/kit-thumbnails/key-contacts.png" },
                { title: "30-60-90 Day Plan",     pdf: "/kit-samples/30-60-90-day-plan.pdf",         thumb: "/kit-thumbnails/30-60-90-day-plan.png" },
                { title: "New Hire Checklist",    pdf: "/kit-samples/new-hire-checklist.pdf",        thumb: "/kit-thumbnails/new-hire-checklist.png" },
                { title: "Complete Kit",          pdf: "/kit-samples/onboarding-kit-sample.pdf",     thumb: "/kit-thumbnails/onboarding-kit-sample.png", featured: true },
              ].map((item) => (
                <a
                  key={item.title}
                  href={item.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kit-sample-card"
                  style={item.featured ? {
                    border: "1.5px solid rgba(30,122,184,0.35)",
                  } : undefined}
                >
                  {/* Real PDF thumbnail — faded behind card content */}
                  <img
                    src={item.thumb}
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top",
                      opacity: 0.13,
                      pointerEvents: "none",
                    }}
                  />
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <h3
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "8px",
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
                  </div>
                </a>
              ))}
            </div>

            {/* CTA after previews */}
            <div style={{ textAlign: "center", paddingTop: "16px" }}>
              <a
                href="#build-kit"
                className="btn btn-primary"
                style={{ display: "inline-block", padding: "14px 36px", fontSize: "1rem" }}
              >
                Build My Kit →
              </a>
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
