import OnboardingKitBuilderTool from "@/components/OnboardingKitBuilderTool";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGENT: Onboarding Kit Builder — promptaiagents.com",
  description:
    "Build a complete onboarding kit for your new hire. Welcome letter, first-week schedule, key contacts, 30/60/90 plan, and priority checklist — as a ready-to-use .docx file.",
  openGraph: {
    title: "AGENT: Onboarding Kit Builder — promptaiagents.com",
    description:
      "Build a complete onboarding kit for your new hire. Delivered as a ready-to-use .docx file.",
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
              Build a complete onboarding kit for your new hire.
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

            {/* Pricing callout */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                background: "rgba(30,122,184,0.06)",
                border: "1px solid rgba(30,122,184,0.15)",
                borderRadius: "8px",
                marginBottom: "48px",
              }}
            >
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
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
                  $97 at full launch · One-time payment.
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section className="section" style={{ paddingTop: "40px" }}>
          <div className="container">
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
              <OnboardingKitBuilderTool
                initialPaymentStatus={searchParams.payment}
                initialSessionId={searchParams.session_id}
              />
            </div>
          </div>
        </section>

        {/* ── What's in the kit ─────────────────────────────────── */}
        <section className="section section-alt" style={{ paddingTop: "64px", paddingBottom: "64px" }}>
          <div className="container-narrow">
            <h2
              className="heading-2"
              style={{ marginBottom: "8px" }}
            >
              What's in the kit.
            </h2>
            <p
              className="body"
              style={{
                color: "var(--text-secondary)",
                marginBottom: "40px",
                maxWidth: "480px",
              }}
            >
              Five documents. One file. Everything a new hire needs to know before Day 1.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {[
                {
                  title: "Welcome Letter",
                  body: "Written from the hiring manager to the new hire. Specific to the role — not a template they'll recognize.",
                },
                {
                  title: "First-Week Schedule",
                  body: "Day-by-day. Deliberately lighter the first two days. Built around orientation, introductions, and access.",
                },
                {
                  title: "Key Contacts",
                  body: "Not the org chart. The people that actually matter for this role, with a one-sentence reason why.",
                },
                {
                  title: "Role Expectations (30/60/90)",
                  body: "What success looks like at each milestone — specific to what this hire was brought on to do.",
                },
                {
                  title: "New Hire Checklist",
                  body: "Pre-start through Month 1. The checklist ladders toward the 30-day milestone so they feel like the same document.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    padding: "22px 24px",
                    background: "var(--bg-surface, #FFFFFF)",
                    border: "1px solid var(--border, #E4E4E2)",
                    borderRadius: "var(--radius-card)",
                  }}
                >
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
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Five questions ────────────────────────────────────── */}
        <section className="section" style={{ paddingTop: "64px", paddingBottom: "80px" }}>
          <div className="container-narrow">
            <h2 className="heading-2" style={{ marginBottom: "8px" }}>
              The five questions most onboarding programs miss.
            </h2>
            <p
              className="body"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "500px",
                marginBottom: "36px",
              }}
            >
              When new hires say they were left trying to "figure out how to win here," it's usually because nobody answered these before Day 1.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "540px" }}>
              {[
                "Why this person was hired, and why now.",
                "What success looks like at 30, 60, and 90 days.",
                "How the team actually works — not the org chart version.",
                "Who they need to know and why those people matter.",
                "When they'll get feedback and from whom.",
              ].map((q, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      minWidth: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "rgba(30,122,184,0.08)",
                      color: "var(--cta)",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {q}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
