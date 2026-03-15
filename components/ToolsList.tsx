"use client";

import { useState } from "react";

type Tool = {
  slug: string;
  href: string;
  badgeClass: string;
  label: string;
  name: string;
  tagline: string;
  description: string;
  cta: string;
  price?: string;
  priceNote?: string;
  image?: string;
};

const FILTERS = ["All", "Free", "Human Resources"];

export default function ToolsList({ tools }: { tools: Tool[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered =
    activeFilter === "All"
      ? tools
      : tools.filter((t) => t.label === activeFilter);

  return (
    <div>
      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "32px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
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
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--cta)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Tools grid */}
      <div className="tools-grid">
        {filtered.map((tool) => (
          <a
            key={tool.slug}
            href={tool.href}
            className="tool-card"
            style={{ position: "relative", overflow: "hidden" }}
          >
            {/* Background preview image */}
            {tool.image && (
              <img
                src={tool.image}
                alt=""
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: "-12px",
                  right: "-12px",
                  width: "72%",
                  opacity: 0.07,
                  pointerEvents: "none",
                  borderRadius: "8px",
                  display: "block",
                }}
              />
            )}

            {/* Badge */}
            <div style={{ marginBottom: "20px", position: "relative" }}>
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
                position: "relative",
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
                marginBottom: 0,
                lineHeight: 1.5,
                flexGrow: 1,
                position: "relative",
              }}
            >
              {tool.tagline}
            </p>

            {/* Pricing (paid tools only) */}
            {tool.price && (
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginTop: "28px",
                  paddingTop: "4px",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    lineHeight: 1,
                  }}
                >
                  {tool.price}
                </span>
                {tool.priceNote && (
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {tool.priceNote}
                  </span>
                )}
              </div>
            )}

            {/* CTA */}
            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--cta)",
                marginTop: tool.price ? "16px" : "28px",
                display: "block",
                position: "relative",
              }}
            >
              {tool.cta}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
