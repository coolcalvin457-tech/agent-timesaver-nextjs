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
    subtitle: "Phase 1",
    tagline: "Prompt naturally. Set up your AI workspace.",
    price: "$500",
    priceUnit: "3 live sessions",
    features: [
      "60 minutes, each tailored to your actual work",
      "Give clear prompts, get precise outcomes",
      "Prompt fluently without overthinking",
      "Set up your workspace profile, memory, tasks",
      "Run sessions with a framework and agenda",
    ],
    ctaLabel: "Schedule a free call",
    ctaHref: "mailto:calvin@promptaiagents.com?subject=AI%20Coaching%20Discovery%20Call%20-%20Beginner",
    ctaStyle: "outline",
  },
  {
    name: "Confident",
    subtitle: "Phase 2",
    tagline: "Own a workflow. Create your first AI agent.",
    price: "$2,500",
    priceUnit: "10 live sessions",
    features: [
      "60 minutes, each tailored to your actual work",
      "Turn a recurring tasks into a workflow",
      "Understand the architecture under the hood",
      "Create your own agent with a series of prompts",
      "Test, review, refine until it achieves the goal",
    ],
    ctaLabel: "Schedule a free call",
    ctaHref: "mailto:calvin@promptaiagents.com?subject=AI%20Coaching%20Discovery%20Call%20-%20Confident",
    ctaStyle: "outline",
  },
  {
    name: "Scale",
    subtitle: "Phase 3",
    tagline: "Scale what works. Build your AI system.",
    price: "$5,000",
    priceUnit: "15 live sessions",
    features: [
      "60 minutes, each tailored to your actual work",
      "Audit your role and prioritize what to delegate",
      "Automate workflows with multiple agents",
      "Build your agentic system",
      "Design a roadmap for future systems",
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
      <Nav dark />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "120px",
          background: "linear-gradient(180deg, #14151A 0%, #0A0A0C 100%)",
          color: "#fff",
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
                color: "#fff",
              }}
            >
              Pricing
            </h1>
            <p
              className="hero-subheadline"
              style={{
                margin: "0 auto",
                color: "rgba(255,255,255,0.65)",
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
