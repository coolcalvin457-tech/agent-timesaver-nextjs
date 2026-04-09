import IndustryIntelTool from "@/components/IndustryIntelTool";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "AGENT: Industry — Prompt AI Agents",
  description:
    "Answer a few questions about your role and industry. Get one sharp insight you can act on this week.",
  openGraph: {
    title: "AGENT: Industry — Prompt AI Agents",
    description:
      "Answer a few questions about your role and industry. Get one sharp insight you can act on this week.",
    url: "https://promptaiagents.com/industry",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

export default function IndustryIntelPage() {
  return (
    <>
      <Nav dark />
      <main style={{ background: "linear-gradient(180deg, #1A1B22 0%, #0E0E10 100%)", minHeight: "100vh" }}>

        {/* ── Hero section ─────────────────────────────────────── */}
        <section
          className="section"
          style={{ paddingTop: "120px", paddingBottom: "24px" }}
        >
          <div className="container" style={{ textAlign: "center" }}>
            <h1
              className="heading-1"
              style={{
                margin: "0 auto 0",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                lineHeight: 1.25,
                color: "#ffffff",
              }}
            >
              <span style={{ display: "block" }}>Every Industry is Evolving.</span>
              <span style={{ display: "block" }}>Find Relevant Insights.</span>
            </h1>
          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section className="section" style={{ paddingTop: "32px", paddingBottom: "96px" }}>
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div className="pb-frame hero-tool-dark">
                <span className="pb-frame-label">AGENT: Industry</span>
                <div className="pb-frame-body">
                  <IndustryIntelTool />
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
