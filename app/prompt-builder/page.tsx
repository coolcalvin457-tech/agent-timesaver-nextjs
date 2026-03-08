import PromptBuilderTool from "@/components/PromptBuilderTool";
import NavClient from "@/components/NavClient";

export const metadata = {
  title: "AGENT: Prompt Builder — promptaiagents.com",
  description:
    "Get 12 ready-to-copy AI prompts personalized to your exact job. Built for non-technical professionals who want real results from AI.",
};

// searchParams carries ?payment=success&session_id=xxx after Stripe redirect
export default function PromptBuilderPage({
  searchParams,
}: {
  searchParams: { payment?: string; session_id?: string };
}) {
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
              <PromptBuilderTool
                paymentStatus={searchParams.payment}
                sessionId={searchParams.session_id}
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
