import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pricing | Prompt AI Agents",
  description:
    "Personal AI Coaching with Calvin. 1-on-1 Zoom sessions to get fluent at prompting, build your first AI agent, and stand up your full AI system.",
  openGraph: {
    title: "Pricing | Prompt AI Agents",
    description:
      "Personal AI Coaching with Calvin. 1-on-1 Zoom sessions to get fluent at prompting, build your first AI agent, and stand up your full AI system.",
    url: "https://promptaiagents.com/pricing",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

type Tier = {
  badge: string;
  badgeFeatured?: boolean;
  name: string;
  tagline: string;
  price: string;
  priceUnit?: string;
  priceNote?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaStyle: "primary" | "outline" | "ghost";
  highlight?: boolean;
};

const coachingTiers: Tier[] = [
  {
    badge: "Starter",
    name: "3 Sessions",
    tagline: "Prompt naturally. Begin your AI workspace.",
    price: "$500",
    priceNote: "Three 60-minute 1-on-1 Zoom sessions with Calvin.",
    features: [
      "Three 60-minute 1-on-1 sessions, live on Zoom",
      "Prompting fluency, in plain English",
      "Your own AI workspace: profile, memory, tasks",
      "Walk away fluent, with AI set up the way you actually work",
    ],
    ctaLabel: "Book a Free Call",
    ctaHref: "mailto:calvin@promptaiagents.com?subject=AI%20Coaching%20Discovery%20Call%20-%20Starter",
    ctaStyle: "outline",
  },
  {
    badge: "Growth",
    name: "8 Sessions",
    tagline: "Prompt with intent. Build your first agent.",
    price: "$2,000",
    priceNote: "Eight 60-minute 1-on-1 Zoom sessions with Calvin.",
    features: [
      "Eight 60-minute 1-on-1 sessions, live on Zoom",
      "Everything in Starter, plus agent architecture",
      "Build your first AI agent around a workflow you actually do",
      "Walk away with a working agent you built yourself",
    ],
    ctaLabel: "Book a Free Call",
    ctaHref: "mailto:calvin@promptaiagents.com?subject=AI%20Coaching%20Discovery%20Call%20-%20Growth",
    ctaStyle: "outline",
  },
  {
    badge: "Scale",
    name: "Team & Custom",
    tagline: "Prompt at scale. Build your full AI system.",
    price: "$5,000",
    priceNote: "Custom engagement, shaped to your outcome.",
    features: [
      "Fifteen 60-minute 1-on-1 sessions, live on Zoom",
      "Or a full-day team training, tailored to your team",
      "Or an AI audit for your small business",
      "Custom scope, shaped to the outcome you want",
    ],
    ctaLabel: "Book a Free Call",
    ctaHref: "mailto:calvin@promptaiagents.com?subject=AI%20Coaching%20Discovery%20Call%20-%20Scale",
    ctaStyle: "outline",
  },
];

function TierCard({ tier }: { tier: Tier }) {
  const ctaClass =
    tier.ctaStyle === "primary"
      ? "pricing-cta pricing-cta-primary"
      : tier.ctaStyle === "ghost"
      ? "pricing-cta pricing-cta-ghost"
      : "pricing-cta pricing-cta-outline";

  return (
    <div className={`pricing-card${tier.highlight ? " pricing-card-highlight" : ""}`}>
      <div>
        <span
          className={`pricing-badge${tier.badgeFeatured ? " pricing-badge-featured" : ""}`}
        >
          {tier.badge}
        </span>
        <h2 className="pricing-tier-name">{tier.name}</h2>
        <p className="pricing-tier-tagline">{tier.tagline}</p>

        <div className="pricing-price-row">
          <span className="pricing-price">{tier.price}</span>
          {tier.priceUnit ? (
            <span className="pricing-price-unit">{tier.priceUnit}</span>
          ) : null}
        </div>
        <div className="pricing-price-note">{tier.priceNote ?? ""}</div>

        <ul className="pricing-features">
          {tier.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      {tier.ctaStyle === "ghost" ? (
        <span className={ctaClass} aria-disabled="true">
          {tier.ctaLabel}
        </span>
      ) : (
        <a className={ctaClass} href={tier.ctaHref}>
          {tier.ctaLabel}
        </a>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "120px",
        }}
      >
        {/* Page header */}
        <div className="container">
          <div style={{ paddingTop: "80px", marginBottom: "56px", textAlign: "center" }}>
            <h1
              className="heading-1"
              style={{
                marginBottom: "20px",
                fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
                lineHeight: 1.05,
              }}
            >
              Pricing
            </h1>
            <p
              className="hero-subheadline"
              style={{
                margin: "0 auto",
              }}
            >
              Personal AI Coaching.
            </p>
          </div>
        </div>

        {/* Coaching cards */}
        <div className="container">
          <div className="pricing-grid-coaching">
            {coachingTiers.map((tier) => (
              <TierCard key={tier.name} tier={tier} />
            ))}
          </div>

          {/* Foot note */}
          <p
            style={{
              textAlign: "center",
              margin: "72px auto 0",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              maxWidth: "560px",
            }}
          >
            Coaching billed per package. Questions? Email{" "}
            <a
              href="mailto:support@promptaiagents.com"
              style={{ color: "var(--cta)", textDecoration: "none" }}
            >
              support@promptaiagents.com
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
