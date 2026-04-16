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
    slug: "prompts",
    href: "/prompts",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Prompts",
    tagline: "12 prompts built for your exact job.",
    description: "",
    cta: "Get Prompts",
  },
  {
    slug: "workflow",
    href: "/workflow",
    badgeClass: "tool-badge-paid",
    label: "$99/yr",
    name: "AGENT: Workflow",
    tagline: "A step-by-step workflow for any task.",
    description: "",
    cta: "Get Workflows",
  },
  {
    slug: "industry",
    href: "/industry",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Industry",
    tagline: "Get intel on your industry.",
    description: "",
    cta: "Get Intel",
  },
  {
    slug: "spreadsheets",
    href: "/spreadsheets",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Spreadsheets",
    tagline: "Model any budget scenario in minutes.",
    description: "",
    cta: "Get Spreadsheets",
  },
  {
    slug: "timesaver",
    href: "/",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Timesaver",
    tagline: "See how many hours you could be saving.",
    description:
      "Start with your job title. Answer a few questions. Get 5 personalized AI time-savers built for your exact role, plus an estimate of how many hours you could save each week.",
    cta: "Get Time-Savers",
  },
  {
    slug: "company",
    href: "/company",
    badgeClass: "tool-badge-paid",
    label: "$149/yr",
    name: "AGENT: Company",
    tagline: "A competitive dossier on any company.",
    description: "",
    cta: "Get Dossiers",
  },
];

export default function AgentsPage() {
  return (
    <>
      <Nav dark />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
          background: "linear-gradient(180deg, #14151A 0%, #0A0A0C 100%)",
          color: "#fff",
        }}
      >
        {/* Page header */}
        <div className="container">
          <div style={{ paddingTop: "80px", marginBottom: "40px", textAlign: "center" }}>
            <h1 className="heading-1" style={{ marginBottom: "20px", fontSize: "clamp(2.75rem, 6vw, 4.5rem)", lineHeight: 1.05, color: "#fff" }}>
              Agents
            </h1>
            <p
              className="hero-subheadline"
              style={{ margin: "0 auto", color: "rgba(255,255,255,0.65)" }}
            >
              Automate your most time-consuming tasks.
            </p>
          </div>
        </div>

        {/* Tools list with filter tabs */}
        <div className="container">
          <ToolsList tools={tools} />

          {/* More tools placeholder */}
          <p style={{ textAlign: "center", margin: "72px auto 56px", fontSize: "0.875rem", color: "rgba(255,255,255,0.4)" }}>
            More agents in progress...
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
