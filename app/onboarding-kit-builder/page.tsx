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
              style={{ padding: "5px 12px", fontSize: "0.8125rem", borderRadius: "6px" }}
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
                  <div style={{ position: "relative", zIndex: 2, width: "100%", textAlign: "right" }}>
                    <h3
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "6px",
                      }}
                    >
                      {item.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.75rem",
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
