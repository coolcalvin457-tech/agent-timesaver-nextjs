import CompetitiveDossierTool from "@/components/CompetitiveDossierTool";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGENT: Company — Prompt AI Agents",
  description:
    "Enter a company URL. Get back a personalized competitive intelligence dossier you can act on. 8 sections. Built for your role.",
  openGraph: {
    title: "AGENT: Company — Prompt AI Agents",
    description:
      "Enter a company URL. Get a 10-page competitive intelligence dossier in 2 minutes. Personalized to your role and relationship.",
    url: "https://promptaiagents.com/company",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

export default function CompetitiveDossierPage({
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
        {/* ── Hero section ─────────────────────────────────────────────── */}
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
              Enter a URL.<br />Get a Dossier.
            </h1>

            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.45)",
                margin: "0 0 32px",
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 800, color: "var(--cta)", fontSize: "1.125rem" }}>$149</span>
              {" · "}
              <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.65)" }}>Annual subscription · 15 dossiers per month.</span>
            </p>

            <a
              href="#build-dossier"
              className="btn btn-dark-cta btn-zoom"
              style={{ padding: "10px 28px", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.04em" }}
            >
              Build Dossier
            </a>
          </div>
        </section>

        {/* ── What's Inside section ──────────────────────────────────────── */}
        <section
          className="section"
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
                What&apos;s Inside Every Dossier
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                {[
                  { num: "01", label: "Company Snapshot" },
                  { num: "02", label: "Business Model and Pricing" },
                  { num: "03", label: "Target Market and Positioning" },
                  { num: "04", label: "Product and Service Breakdown" },
                  { num: "05", label: "Growth Signals" },
                  { num: "06", label: "Content and Public Voice" },
                  { num: "07", label: "Strengths and Gaps" },
                  { num: "08", label: "What This Means for You" },
                ].map((item) => (
                  <div
                    key={item.num}
                    style={{
                      background: "linear-gradient(135deg, #1F2228, #1A1A1C)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "var(--radius-card, 12px)",
                      padding: "16px",
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontFamily: "var(--font-mono, monospace)", fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
                      {item.num}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.80)", fontWeight: 500, lineHeight: 1.4 }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Tool section ───────────────────────────────────────────────── */}
        <section id="build-dossier" className="section" style={{ paddingTop: "64px", paddingBottom: "96px", scrollMarginTop: "80px" }}>
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div className="pb-frame hero-tool-dark">
                <span className="pb-frame-label">AGENT: Company</span>
                <div className="pb-frame-body">
                  <CompetitiveDossierTool
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
