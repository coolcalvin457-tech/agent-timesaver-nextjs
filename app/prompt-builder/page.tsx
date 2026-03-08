import PromptBuilderTool from "@/components/PromptBuilderTool";
import NavClient from "@/components/NavClient";

export const metadata = {
  title: "AGENT: Prompt Builder — promptaiagents.com",
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
            <div className="section-label">AGENT: Prompt Builder</div>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <PromptBuilderTool />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
