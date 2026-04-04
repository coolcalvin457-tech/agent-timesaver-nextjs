"use client";

import { useState } from "react";

type Tool = {
  slug: string;
  href: string;
  badgeClass: string;
  label: string;
  badgeDisplay?: string;
  name: string;
  tagline: string;
  description: string;
  cta: string;
  image?: string;
  isComingSoon?: boolean;
};

const FILTERS = ["All"];

export default function ToolsList({ tools }: { tools: Tool[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered =
    activeFilter === "All"
      ? tools
      : tools.filter((t) => t.label === activeFilter);

  return (
    <div>
      {/* Filter tabs hidden: only one category remaining */}


      {/* Tools grid */}
      <div className="tools-grid">
        {filtered.map((tool) => (
          <div
            key={tool.slug}
            className="tool-card"
            style={{
              cursor: tool.isComingSoon ? "default" : "pointer",
              opacity: tool.isComingSoon ? 0.5 : 1,
            }}
            onClick={() => { if (!tool.isComingSoon) window.location.href = tool.href; }}
          >
            {/* Badge */}
            <div style={{ marginBottom: "20px" }}>
              <span className={tool.isComingSoon ? "tool-badge-coming-soon" : tool.badgeClass}>
                {tool.badgeDisplay ?? tool.label}
              </span>
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
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              {tool.tagline}
            </p>

            {/* Coming soon placeholder */}
            {tool.isComingSoon && (
              <div
                style={{
                  marginTop: "20px",
                  height: "130px",
                  borderRadius: "8px",
                  border: "1px dashed var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  In progress
                </span>
              </div>
            )}

            {/* Preview image */}
            {tool.image && (
              <div
                style={{
                  marginTop: "20px",
                  height: "130px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  background: "var(--surface-raised, #f5f5f3)",
                }}
              >
                <img
                  src={tool.image}
                  alt={`${tool.name} sample output`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top left",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* Spacer */}
            <div style={{ flexGrow: 1 }} />

            {/* CTA */}
            {!tool.isComingSoon && (
              <a
                href={tool.href}
                style={{
                  fontSize: "0.9375rem",
                  marginTop: "24px",
                  fontWeight: 600,
                  color: "var(--cta)",
                  display: "block",
                  textDecoration: "none",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {tool.cta}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
