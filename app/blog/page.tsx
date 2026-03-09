import type { Metadata } from "next";
import NavClient from "@/components/NavClient";
import BlogList from "@/components/BlogList";

export const metadata: Metadata = {
  title: "Blogs | promptaiagents.com",
  description:
    "Practical AI skills for non-technical people. Real workflows, honest takes, and a clear path forward.",
  openGraph: {
    title: "Blogs | promptaiagents.com",
    description:
      "Practical AI skills for non-technical people. Real workflows, honest takes, and a clear path forward.",
    url: "https://promptaiagents.com/blog",
    siteName: "promptaiagents.com",
    type: "website",
  },
};

const posts = [
  {
    slug: "your-team-thinks-youre-a-tech-wizard",
    titleLines: [
      "Your Team Thinks You're a Tech Wizard.",
      "All You Did Was Learn One Workflow.",
    ],
    category: "Non-Technical AI Skills",
    date: "March 9, 2026",
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
        <div className="container-narrow">
          {/* Header */}
          <div style={{ paddingTop: "40px", marginBottom: "56px" }}>
            <h1 className="heading-1" style={{ marginBottom: "14px" }}>
              Blogs
            </h1>
            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "480px",
              }}
            >
              Practical AI skills for non-technical people.<br />
              Real workflows you can try now.
            </p>
          </div>

          {/* Blog list with category filter */}
          <BlogList posts={posts} />
        </div>
      </main>
    </>
  );
}
