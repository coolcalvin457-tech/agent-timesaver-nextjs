import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pricing | Prompt AI Agents",
  description:
    "Simple pricing for every agent. Free tools, paid agents at $49, $99, and $149 per year, plus future all-access and 1-on-1 AI Coaching.",
  openGraph: {
    title: "Pricing | Prompt AI Agents",
    description:
      "Simple pricing for every agent. Free tools, paid agents at $49, $99, and $149 per year, plus future all-access and 1-on-1 AI Coaching.",
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

const mainTiers: Tier[] = [
  {
    badge: "Free",
    name: "Free Agents",
    tagline: "Start here. No card required.",
    price: "$0",
    priceNote: "Three agents, always free.",
    features: [
      "AGENT: Timesaver",
      "AGENT: Prompts",
      "AGENT: Spreadsheets",
      "AGENT: Industry (free tier)",
      "Results delivered to your inbox",
    ],
    ctaLabel: "Explore free agents",
    ctaHref: "/agents",
    ctaStyle: "outline",
  },
  {
    badge: "Most Popular",
    badgeFeatured: true,
    name: "AGENT: Workflow",
    tagline: "Your first paid agent.",
    price: "$49",
    priceUnit: "/year",
    priceNote: "The first step into paid agents.",
    features: [
      "Turn any task into a step-by-step workflow",
      "Unlimited workflow generations",
      "Download and email delivery",
      "Everything in Free",
    ],
    ctaLabel: "Get Workflow",
    ctaHref: "/workflow",
    ctaStyle: "primary",
    highlight: true,
  },
  {
    badge: "For HR",
    name: "HR Agents Package",
    tagline: "Two agents built for HR work.",
    price: "$99",
    priceUnit: "/year",
    priceNote: "Onboarding + PIP, bundled.",
    features: [
      "AGENT: Onboarding",
      "AGENT: PIP",
      "Unlimited kits and plans",
      "Download and email delivery",
      "Everything in Free",
    ],
    ctaLabel: "Get HR Package",
    ctaHref: "/onboarding",
    ctaStyle: "outline",
  },
  {
    badge: "Intel",
    name: "AGENT: Company",
    tagline: "Deep dossiers on any company.",
    price: "$149",
    priceUnit: "/year",
    priceNote: "Unlimited company research.",
    features: [
      "Full competitive dossiers on demand",
      "Unlimited company lookups",
      "Download and email delivery",
      "Everything in Free",
    ],
    ctaLabel: "Get Company",
    ctaHref: "/company",
    ctaStyle: "outline",
  },
];

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
      <Nav dark />
      <main
        style={{
          minHeight: "100vh",
          background: "var(--dark)",
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
                color: "#FFFFFF",
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
                color: "rgba(255,255,255,0.65)",
                margin: "0 auto",
              }}
            >
              Built for real jobs. Not demos.
            </p>
          </div>
        </div>

        {/* Main tier cards */}
        <div className="container">
          <div className="pricing-grid-main">
            {mainTiers.map((tier) => (
              <TierCard key={tier.name} tier={tier} />
            ))}
          </div>

          {/* 1-on-1 AI Coaching header */}
          <div
            style={{
              maxWidth: "1280px",
              margin: "96px auto 0",
              textAlign: "center",
            }}
          >
            <h2
              className="heading-1"
              style={{
                color: "#FFFFFF",
                fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)",
                lineHeight: 1.15,
                marginBottom: "12px",
              }}
            >
              1-on-1 AI Coaching.
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "1rem",
                maxWidth: "560px",
                margin: "0 auto 32px",
                lineHeight: 1.6,
              }}
            >
              Live coaching with Calvin. Go from stuck to building your own agents.
            </p>
          </div>

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
              color: "rgba(255,255,255,0.45)",
              maxWidth: "560px",
            }}
          >
            Agents billed annually. Coaching billed per package. Cancel anytime. Questions? Email{" "}
            <a
              href="mailto:support@promptaiagents.com"
              style={{ color: "#6DB8E8", textDecoration: "none" }}
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
