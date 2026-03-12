import BudgetSpreadsheetTool from "@/components/BudgetSpreadsheetTool";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";

export const metadata = {
  title: "AGENT: Budget Spreadsheets — promptaiagents.com",
  description:
    "Downloads transfer to Google Sheets, Excel, and Numbers.",
};

export default function BudgetSpreadsheetsPage() {
  return (
    <>
      <NavClient />
      <main>
        <section
          className="section section-alt"
          style={{ paddingTop: "120px", minHeight: "100vh" }}
        >
          <div className="container">
            <h1
              className="heading-1"
              style={{ marginBottom: "16px", textAlign: "center" }}
            >
              Describe your budget.
              <br />
              Get a spreadsheet.
            </h1>
            <p
              className="body-lg"
              style={{
                textAlign: "center",
                color: "var(--text-secondary)",
                maxWidth: "480px",
                margin: "0 auto 48px",
              }}
            >
              Describe what you need and get a formatted spreadsheet.
            </p>
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
              <BudgetSpreadsheetTool />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
