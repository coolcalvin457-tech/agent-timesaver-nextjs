import type { Metadata } from "next";
import NavClient from "@/components/NavClient";

export const metadata: Metadata = {
  title: "Blog | promptaiagents.com",
  description:
    "Practical AI skills for non-technical professionals. Real workflows, honest takes, and a clear path forward.",
  openGraph: {
    title: "Blog — promptaiagents.com",
    description:
      "Practical AI skills for non-technical professionals. Real workflows, honest takes, and a clear path forward.",
    url: "https://promptaiagents.com/blog",
    siteName: "promptaiagents.com",
    type: "website",
  },
};

const posts = [
  {
    slug: "how-to-start-using-ai-at-work",
    title: "How to Actually Start Using AI at Work (And Build Your Own Agent)",
    category: "Non-Technical AI Skills",
    date: "March 8, 2026",
    excerpt:
      "Most people open AI and type something vague. They get a generic result, close the tab, and wonder what all the fuss is about. Here's what actually works — and where it leads.",
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
            <div
              className="tool-tag"
              style={{ marginBottom: "20px" }}
            >
              promptaiagents.com
            </div>
            <h1 className="heading-1" style={{ marginBottom: "14px" }}>
              Blog
            </h1>
            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "480px",
              }}
            >
              Practical AI skills for non-technical professionals. Real
              workflows, no hype.
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
                  {post.title}
                </h2>
                <p
                  className="body"
                  style={{
                    color: "var(--text-secondary)",
                    marginBottom: "20px",
                    lineHeight: 1.7,
                  }}
                >
                  {post.excerpt}
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
