import type { Metadata } from "next";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";
import ToolsList from "@/components/ToolsList";

export const metadata: Metadata = {
  title: "Tools | promptaiagents.com",
  description:
    "Free and paid AI tools built for real jobs. Start with your job title. Get workflows, prompts, and systems that actually fit your role.",
  openGraph: {
    title: "Tools | promptaiagents.com",
    description:
      "Free and paid AI tools built for real jobs. Start with your job title. Get workflows, prompts, and systems that actually fit your role.",
    url: "https://promptaiagents.com/tools",
    siteName: "promptaiagents.com",
    type: "website",
  },
};

const tools = [
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
    image: "/tool-previews/timesaver-preview.png",
  },
  {
    slug: "prompt-builder",
    href: "/prompt-builder",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Prompt Builder",
    tagline: "Receive 12 job specific prompts.",
    description:
      "Answer 4 questions about how you work. Get a personalized Prompt Kit: 12 ready-to-copy prompts organized by category, an AI Profile paragraph, and a Build Your AI System guide.",
    cta: "Get Free Prompts",
    image: "/tool-previews/prompt-builder-preview.png",
  },
  {
    slug: "budget-spreadsheets",
    href: "/budget-spreadsheets",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Budget Spreadsheets",
    tagline: "Budget for \"what-if\" scenarios.",
    description:
      "Include categories, timeframes, and any numbers you have. Upload a previous example if available. The more detail, the better the results.",
    cta: "Get Free Spreadsheets",
    image: "/tool-previews/budget-spreadsheets-preview.png",
  },
  {
    slug: "onboarding-kit-builder",
    href: "/onboarding-kit-builder",
    badgeClass: "tool-badge-paid",
    label: "Human Resources",
    badgeDisplay: "$49",
    name: "AGENT: Onboarding Kit Builder",
    tagline: "Use for every new hire.",
    description:
      "Includes warm welcome letter, first-week schedule, key contacts, 30/60/90 plan, and priority checklist.",
    cta: "Build My Kit",
    image: "/tool-previews/onboarding-kit-preview.png",
  },
  {
    slug: "pip-builder",
    href: "#",
    badgeClass: "tool-badge-paid",
    label: "Human Resources",
    badgeDisplay: "Coming Soon",
    name: "AGENT: PIP Builder",
    tagline: "Document performance issues the right way.",
    description: "",
    cta: "",
    isComingSoon: true,
  },
  {
    slug: "performance-review-builder",
    href: "#",
    badgeClass: "tool-badge-paid",
    label: "Human Resources",
    badgeDisplay: "Coming Soon",
    name: "AGENT: Performance Review Builder",
    tagline: "Generate structured reviews in minutes.",
    description: "",
    cta: "",
    isComingSoon: true,
  },
];

export default function ToolsPage() {
  return (
    <>
      <NavClient />
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
              Tools
            </h1>
            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                margin: "0 auto",
              }}
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
                color: "var(--text-muted)",
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
