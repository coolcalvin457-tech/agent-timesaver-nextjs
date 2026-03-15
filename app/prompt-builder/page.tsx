import PromptBuilderTool from "@/components/PromptBuilderTool";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";

export const metadata = {
  title: "AGENT: Prompt Builder — Prompt AI Agents",
  description:
    "Get 12 ready-to-copy AI prompts personalized to your exact job. Built for non-technical professionals who want real results from AI.",
};

export default function PromptBuilderPage() {
  return (
    <>
      <NavClient />
      <main>
        <section
          className="section section-alt"
          style={{ paddingTop: "120px", minHeight: "100vh" }}
        >
          <div className="container">
            <div className="eyebrow" style={{ marginBottom: "12px", textAlign: "center" }}>
              AGENT: Prompt Builder
            </div>
            <h1
              className="heading-1"
              style={{ marginBottom: "48px", textAlign: "center" }}
            >
              12 prompts built for your exact job.
            </h1>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <PromptBuilderTool />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
