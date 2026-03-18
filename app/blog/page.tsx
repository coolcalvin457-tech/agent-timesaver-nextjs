import type { Metadata } from "next";
import NavClient from "@/components/NavClient";
import BlogList from "@/components/BlogList";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog | Prompt AI Agents",
  description:
    "Practical AI skills for non-technical people. Real workflows, honest takes, and a clear path forward.",
  openGraph: {
    title: "Blog | Prompt AI Agents",
    description:
      "Practical AI skills for non-technical people. Real workflows, honest takes, and a clear path forward.",
    url: "https://promptaiagents.com/blog",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

const posts = [
  {
    slug: "your-ai-has-never-seen-your-best-work",
    titleLines: [
      "Your AI Has Never Seen Your Best Work.",
      "Why Not Show It?",
    ],
    category: "Non-Technical AI Skills",
    date: "March 14, 2026",
    readingTime: "3 min read",
    excerptLines: [
      "The gap between generic AI responses and great ones",
      "is one missing ingredient: your best work.",
    ],
  },
  {
    slug: "your-team-thinks-youre-a-tech-wizard",
    titleLines: [
      "Your Team Thinks You're a Tech Wizard.",
      "All You Did Was Learn One Workflow.",
    ],
    category: "Non-Technical AI Skills",
    date: "March 9, 2026",
    readingTime: "4 min read",
    excerptLines: [
      "Your coworkers will think you came from the future.",
      "You just learned one workflow.",
    ],
  },
  {
    slug: "build-once-never-re-explain-ai",
    titleLines: [
      "Build Once and You'll Never Have to",
      "Re-Explain to AI Again",
    ],
    category: "Non-Technical AI Skills",
    date: "March 9, 2026",
    readingTime: "4 min read",
    excerptLines: [
      "Getting valuable output requires valuable input.",
      "That input has a name: context.",
    ],
  },
  {
    slug: "how-to-start-using-ai-at-work",
    titleLines: [
      "How to Actually Start Using AI at Work and",
      "Build Your Own Agent",
    ],
    category: "Non-Technical AI Skills",
    date: "March 8, 2026",
    readingTime: "5 min read",
    excerptLines: [
      "Here's a secret: those prompts were designed to stop the scroll,",
      "not actually help you out.",
    ],
  },
];

export default function BlogPage() {
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
              Blog
            </h1>
            <p
              className="hero-subheadline"
              style={{ margin: "0 auto" }}
            >
              Built for real jobs. Not demos.
            </p>
          </div>
        </div>

        {/* Blog list with category filter */}
        <div className="container-narrow">
          <BlogList posts={posts} />
        </div>
      </main>
      <Footer />
    </>
  );
}
