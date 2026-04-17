import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Us | Prompt AI Agents",
  description:
    "We're studying AI so that you don't have to. Prompt AI Agents helps non-technical professionals apply AI at their specific job.",
  openGraph: {
    title: "About Us | Prompt AI Agents",
    description:
      "We're studying AI so that you don't have to. Prompt AI Agents helps non-technical professionals apply AI at their specific job.",
    url: "https://promptaiagents.com/about",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
        }}
      >
        {/* Page header — matches Agents + Blog format */}
        <div className="container">
          <div style={{ paddingTop: "80px", marginBottom: "64px", textAlign: "center" }}>
            <h1
              className="heading-1"
              style={{
                marginBottom: "14px",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                lineHeight: 1.05,
              }}
            >
              About Us
            </h1>
            <p
              className="hero-subheadline"
              style={{ margin: "0 auto", fontSize: "clamp(1.125rem, 2vw, 1.375rem)", fontWeight: 400 }}
            >
              Built for real jobs. Not demos.
            </p>
          </div>
        </div>

        {/* Mission section — carried from homepage */}
        <div className="container">
          <div className="manifesto-split">
            {/* Left: headline */}
            <div>
              <h2
                className="heading-1"
                style={{
                  fontSize: "var(--section-headline-size)",
                  lineHeight: "var(--section-headline-lh)",
                  letterSpacing: "var(--section-headline-ls)",
                  marginBottom: 0,
                }}
              >
                <span style={{ display: "block" }}>We&apos;re studying AI so that</span>
                <span style={{ display: "block" }}>you don&apos;t have to.</span>
              </h2>
            </div>
            {/* Right: body */}
            <div className="manifesto-split-right">
              <p className="manifesto-body">
                We&apos;ll help you apply AI at your specific job.<br />
                We&apos;ll teach you how to create your own agents.<br />
                You&apos;ll be able to maximize your productivity.<br />
                Because your time is irreplaceable.
              </p>
            </div>
          </div>
        </div>

        {/* Founder section — placeholder for Calvin's photo */}
        <div className="container">
          <div className="about-founder-grid">
            {/* Photo placeholder */}
            <div
              style={{
                aspectRatio: "4 / 5",
                backgroundColor: "#F0EFED",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                fontSize: "0.875rem",
                fontFamily: "var(--font-sans)",
                border: "1px dashed #ccc",
              }}
            >
              Calvin&apos;s photo goes here
            </div>

            {/* Founder text */}
            <div>
              <div className="eyebrow" style={{ marginBottom: "20px" }}>
                MEET THE FOUNDER
              </div>
              <h2
                className="heading-1"
                style={{
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  lineHeight: 1.15,
                  marginBottom: "24px",
                }}
              >
                Calvin Murphy
              </h2>
              <p
                style={{
                  fontSize: "var(--section-body-size)",
                  lineHeight: "var(--section-body-lh)",
                  color: "#767674",
                  fontWeight: 300,
                  letterSpacing: "0.01em",
                }}
              >
                Calvin built the entire Prompt AI Agents platform without writing
                a single line of code. He prompted his way to a functioning
                product: agents, workflows, payments, email delivery, all of it.
                He is his own ICP. That&apos;s not a marketing angle. That&apos;s
                the truth.
              </p>
            </div>
          </div>
        </div>

        {/* Scoped styles for founder grid */}
        <style>{`
          .about-founder-grid {
            max-width: 1200px;
            margin: 80px auto 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            align-items: center;
          }
          @media (max-width: 768px) {
            .about-founder-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
