import type { Metadata } from "next";
import NavClient from "@/components/NavClient";

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

          {/* Post list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {posts.map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="blog-card"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <span className="blog-tag">{post.category}</span>
                  <span
                    className="caption"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {post.date}
                  </span>
                </div>
                <h2
                  className="heading-2"
                  style={{ marginBottom: "12px", color: "var(--text-primary)" }}
                >
                  {post.titleLines[0]}<br />{post.titleLines[1]}
                </h2>
                <p
                  className="body"
                  style={{
                    color: "var(--text-secondary)",
                    marginBottom: "20px",
                    lineHeight: 1.7,
                  }}
                >
                  {post.excerptLines[0]}<br />{post.excerptLines[1]}
                </p>
                <span
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--cta)",
                  }}
                >
                  Read the post →
                </span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
