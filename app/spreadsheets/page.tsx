import BudgetSpreadsheetTool from "@/components/BudgetSpreadsheetTool";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "AGENT: Spreadsheets — Prompt AI Agents",
  description:
    "Describe your budget and get a formatted, formula-filled .xlsx file in seconds.",
  openGraph: {
    title: "AGENT: Spreadsheets — Prompt AI Agents",
    description:
      "Describe your budget and get a formatted, formula-filled .xlsx file in seconds.",
    url: "https://promptaiagents.com/spreadsheets",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

export default function BudgetSpreadsheetsPage() {
  return (
    <>
      <Nav dark />
      <main
        style={{
          background: "linear-gradient(180deg, #14151A 0%, #0A0A0C 100%)",
          minHeight: "100vh",
        }}
      >
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
              <span style={{ display: "block" }}>Describe Your Budget.</span>
              <span style={{ display: "block" }}>Get a Spreadsheet.</span>
            </h1>
          </div>
        </section>

        {/* ── Tool section ─────────────────────────────────────── */}
        <section
          className="section"
          style={{ paddingTop: "32px", paddingBottom: "96px" }}
        >
          <div className="container">
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div className="pb-frame hero-tool-dark">
                <span className="pb-frame-label">AGENT: Spreadsheets</span>
                <div className="pb-frame-body">
                  <BudgetSpreadsheetTool />
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
