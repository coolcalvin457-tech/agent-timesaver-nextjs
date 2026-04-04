"use client";

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
};

export default function ToolsList({ tools }: { tools: Tool[] }) {
  return (
    <div>
      {/* Tools grid */}
      <div className="tools-grid">
        {tools.map((tool) => (
          <div
            key={tool.slug}
            className="tool-card"
            style={{ cursor: "pointer" }}
            onClick={() => { window.location.href = tool.href; }}
          >
            {/* Badge */}
            <div style={{ marginBottom: "20px" }}>
              <span className={tool.badgeClass}>
                {tool.badgeDisplay ?? tool.label}
              </span>
            </div>

            {/* Name */}
            <h2 className="tool-card-name">
              {tool.name}
            </h2>

            {/* Tagline */}
            <p className="tool-card-tagline">
              {tool.tagline}
            </p>

            {/* Spacer */}
            <div style={{ flexGrow: 1 }} />

            {/* CTA */}
            <a
              href={tool.href}
              className="tool-card-cta"
              onClick={(e) => e.stopPropagation()}
            >
              {tool.cta}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
