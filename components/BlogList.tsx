"use client";

import { useState } from "react";

type Post = {
  slug: string;
  titleLines: string[];
  category: string;
  date: string;
  readingTime?: string;
  excerptLines: string[];
};

export default function BlogList({ posts }: { posts: Post[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  // Derive unique categories from posts array — new tabs appear automatically
  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];

  const filtered =
    activeFilter === "All"
      ? posts
      : posts.filter((p) => p.category === activeFilter);

  return (
    <div>
      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "40px",
          flexWrap: "wrap",
        }}
      >
        {categories.map((cat) => {
          const isActive = activeFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: isActive
                  ? "1px solid var(--cta)"
                  : "1px solid var(--border)",
                background: isActive ? "var(--cta)" : "var(--surface)",
                color: isActive ? "#ffffff" : "var(--text-secondary)",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.4,
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--cta)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-secondary)";
                }
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Post list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {filtered.map((post) => (
          <a key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
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
              {post.readingTime && (
                <span
                  className="caption"
                  style={{ color: "var(--text-muted)" }}
                >
                  · {post.readingTime}
                </span>
              )}
            </div>
            <h2
              className="heading-2"
              style={{ marginBottom: "12px", color: "var(--text-primary)" }}
            >
              {post.titleLines[0]}
              <br />
              {post.titleLines[1]}
            </h2>
            <p
              className="body"
              style={{
                color: "var(--text-secondary)",
                marginBottom: "20px",
                lineHeight: 1.7,
              }}
            >
              {post.excerptLines[0]}
              <br />
              {post.excerptLines[1]}
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
  );
}
