import BudgetSpreadsheetTool from "@/components/BudgetSpreadsheetTool";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";

export const metadata = {
  title: "AGENT: Budget Spreadsheets — promptaiagents.com",
  description:
    "Describe your budget in plain language. Get a complete, formatted, formula-filled Excel spreadsheet ready to download in seconds.",
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
              No templates. No manual setup. Tell the AI what you need and it builds
              a complete, formatted .xlsx file you can open and use right away.
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
