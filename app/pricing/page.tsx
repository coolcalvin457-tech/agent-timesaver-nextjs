import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pricing | Prompt AI Agents",
  description:
    "Personal AI Coaching with Calvin. Live 1-on-1 sessions to get fluent at prompting, build your first AI agent, and stand up your full AI system.",
  openGraph: {
    title: "Pricing | Prompt AI Agents",
    description:
      "Personal AI Coaching with Calvin. Live 1-on-1 sessions to get fluent at prompting, build your first AI agent, and stand up your full AI system.",
    url: "https://promptaiagents.com/pricing",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

type Tier = {
  name: string;
  subtitle: string;
  tagline: string;
  price: string;
  priceUnit?: string;
  priceNote?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaStyle: "primary" | "outline" | "ghost";
  featured?: boolean;
};

const coachingTiers: Tier[] = [
  {
    name: "Beginner",
    subtitle: "3 Sessions",
    tagline: "Prompt naturally. Begin your AI workspace.",
    price: "$500",
    priceUnit: "3 live sessions",
    features: [
      "Three 60-minute 1-on-1 sessions, live",
      "Prompting fluency, in plain English",
      "Your own AI workspace: profile, memory, tasks",
      "Walk away fluent, with AI set up the way you actually work",
    ],
    ctaLabel: "Schedule a free call",
    ctaHref: "mailto:calvin@promptaiagents.com?subject=AI%20Coaching%20Discovery%20Call%20-%20Beginner",
    ctaStyle: "outline",
  },
  {
    name: "Confident",
    subtitle: "10 Sessions",
    tagline: "Own a workflow. Create your first agent.",
    price: "$2,500",
    priceUnit: "10 live sessions",
    features: [
      "Ten 60-minute 1-on-1 sessions, live",
      "Everything in Beginner, plus agent architecture",
      "Build your first AI agent around a workflow you actually do",
      "Walk away with a working agent you built yourself",
    ],
    ctaLabel: "Schedule a free call",
    ctaHref: "mailto:calvin@promptaiagents.com?subject=AI%20Coaching%20Discovery%20Call%20-%20Confident",
    ctaStyle: "outline",
  },
  {
    name: "Scale",
    subtitle: "15 Sessions",
    tagline: "Scale what works. Build out your AI system.",
    price: "$5,000",
    priceUnit: "15 live sessions",
    features: [
      "Fifteen 60-minute 1-on-1 sessions, live",
      "Everything in Confident, plus system-level architecture",
      "Build a system of 2-3 agents around your role",
      "Walk away with an AI system you built and can extend yourself",
    ],
    ctaLabel: "Schedule a free call",
    ctaHref: "mailto:calvin@promptaiagents.com?subject=AI%20Coaching%20Discovery%20Call%20-%20Scale",
    ctaStyle: "outline",
    featured: true,
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
    <div className={`pricing-card${tier.featured ? " pricing-card-featured" : ""}`}>
      <div>
        <span className="pricing-subtitle-badge">{tier.subtitle}</span>
        <h2 className="pricing-tier-name">{tier.name}</h2>
        <p className="pricing-tier-tagline">{tier.tagline}</p>

        <div className="pricing-price-row">
          <span className="pricing-price">{tier.price}</span>
          {tier.priceUnit ? (
            <span className="pricing-price-unit">{tier.priceUnit}</span>
          ) : null}
        </div>

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
              One-on-one, live AI coaching.
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
        </div>
      </main>
      <Footer />
    </>
  );
}
