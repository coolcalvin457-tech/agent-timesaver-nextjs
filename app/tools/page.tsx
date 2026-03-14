import type { Metadata } from "next";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tools | promptaiagents.com",
  description:
    "Free and paid AI tools built for non-technical professionals. Start with your job title. Get workflows, prompts, and systems that actually fit your role.",
  openGraph: {
    title: "Tools | promptaiagents.com",
    description:
      "Free and paid AI tools built for non-technical professionals. Start with your job title. Get workflows, prompts, and systems that actually fit your role.",
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
    tagline: "Find your 5 AI workflows in 5 minutes.",
    description:
      "Start with your job title. Answer a few questions. Get 5 personalized AI workflows built for your exact role, plus an estimate of how many hours you could save each week.",
    cta: "Get Free Workflows →",
  },
  {
    slug: "prompt-builder",
    href: "/prompt-builder",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Prompt Builder",
    tagline: "12 prompts built around your role. Ready to copy.",
    description:
      "Answer 4 questions about how you work. Get a personalized Prompt Kit: 12 ready-to-copy prompts organized by category, an AI Profile paragraph, and a Build Your AI System guide.",
    cta: "Build My Prompt Kit →",
  },
  {
    slug: "budget-spreadsheets",
    href: "/budget-spreadsheets",
    badgeClass: "tool-badge-free",
    label: "Free",
    name: "AGENT: Budget Spreadsheets",
    tagline: "Describe your budget. Get a spreadsheet.",
    description:
      "Include categories, timeframes, and any numbers you have. Upload a previous example if available. The more detail, the better the results.",
    cta: "Build My Spreadsheet →",
  },
  {
    slug: "onboarding-kit-builder",
    href: "/onboarding-kit-builder",
    badgeClass: "tool-badge-paid",
    label: "HR Tools",
    name: "AGENT: Onboarding Kit Builder",
    tagline: "Built for the role, not just the company.",
    description:
      "Answer a few questions about your new hire and get a complete, personalized onboarding kit — welcome letter, first-week schedule, key contacts, 30/60/90 plan, and new hire checklist — as a ready-to-use .docx file.",
    cta: "Build My Kit →",
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
        <div className="container-narrow">
          <div style={{ paddingTop: "40px", marginBottom: "64px" }}>
            <h1 className="heading-1" style={{ marginBottom: "14px" }}>
              Tools
            </h1>
            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "480px",
              }}
            >
              AI tools built for non-technical professionals.
              <br />
              Pick the one that fits where you are right now.
            </p>
          </div>
        </div>

        {/* Tools grid */}
        <div className="container">
          <div className="tools-grid">
            {tools.map((tool) => (
              <a key={tool.slug} href={tool.href} className="tool-card">
                {/* Badge */}
                <div style={{ marginBottom: "20px" }}>
                  <span className={tool.badgeClass}>{tool.label}</span>
                </div>

                {/* Name */}
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                    lineHeight: 1.3,
                  }}
                >
                  {tool.name}
                </h2>

                {/* Tagline */}
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: "16px",
                    lineHeight: 1.5,
                  }}
                >
                  {tool.tagline}
                </p>

                {/* Description */}
                <p
                  className="body"
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    flexGrow: 1,
                    marginBottom: "28px",
                  }}
                >
                  {tool.description}
                </p>

                {/* CTA */}
                <span
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--cta)",
                  }}
                >
                  {tool.cta}
                </span>
              </a>
            ))}
          </div>

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
