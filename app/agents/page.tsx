import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ToolsList from "@/components/ToolsList";

export const metadata: Metadata = {
  title: "Agents | Prompt AI Agents",
  description:
    "Free and paid AI agents built for real jobs. Start with your job title. Get workflows, prompts, and systems that actually fit your role.",
  openGraph: {
    title: "Agents | Prompt AI Agents",
    description:
      "Free and paid AI agents built for real jobs. Start with your job title. Get workflows, prompts, and systems that actually fit your role.",
    url: "https://promptaiagents.com/agents",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

const tools = [
  {
    slug: "prompt-builder",
    href: "/prompt-builder",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Prompt Builder",
    tagline: "Receive 12 job-specific prompts.",
    description: "",
    cta: "Get Free Prompts",
  },
  {
    slug: "workflow-builder",
    href: "/workflow-builder",
    badgeClass: "tool-badge-paid",
    label: "All Roles",
    badgeDisplay: "$49/yr",
    name: "AGENT: Workflow Builder",
    tagline: "Build the playbook for any task.",
    description: "",
    cta: "Build Workflow",
  },
  {
    slug: "industry-intel",
    href: "/industry-intel",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Industry Intel",
    tagline: "Read AI's insights on your industry.",
    description: "",
    cta: "Read Industry Intel",
  },
  {
    slug: "budget-spreadsheets",
    href: "/budget-spreadsheets",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Budget Spreadsheets",
    tagline: "Budget for \"what-if\" scenarios.",
    description: "",
    cta: "Get Free Spreadsheets",
  },
  {
    slug: "timesaver",
    href: "/",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Timesaver",
    tagline: "Find your 5 workflows.",
    description:
      "Start with your job title. Answer a few questions. Get 5 personalized AI workflows built for your exact role, plus an estimate of how many hours you could save each week.",
    cta: "Get Free Workflows",
  },
];

export default function AgentsPage() {
  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
        }}
      >
        {/* Page header */}
        <div className="container">
          <div style={{ paddingTop: "80px", marginBottom: "40px", textAlign: "center" }}>
            <h1 className="heading-1" style={{ marginBottom: "14px", fontSize: "clamp(2.75rem, 6vw, 4.5rem)", lineHeight: 1.05 }}>
              Agents
            </h1>
            <p
              className="hero-subheadline"
              style={{ margin: "0 auto" }}
            >
              Built for real jobs. Not demos.
            </p>
          </div>
        </div>

        {/* Tools list with filter tabs */}
        <div className="container">
          <ToolsList tools={tools} />

          {/* More tools placeholder */}
          <div className="tools-coming-soon">
            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255, 255, 255, 0.45)",
                margin: 0,
              }}
            >
              More tools in progress. Building in public at{" "}
              <a
                href="/blog"
                style={{
                  color: "var(--cta)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                promptaiagents.com/blog
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
