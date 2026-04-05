import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Community | Prompt AI Agents",
  description:
    "A place to learn alongside other non-technical professionals who are figuring out AI at work. Coming soon.",
};

export default function CommunityPage() {
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
        <div className="container">
          <div style={{ paddingTop: "80px", marginBottom: "40px", textAlign: "center" }}>
            <h1 className="heading-1" style={{ marginBottom: "14px", fontSize: "clamp(2.75rem, 6vw, 4.5rem)", lineHeight: 1.05 }}>
              Community
            </h1>
            <p
              className="hero-subheadline"
              style={{ margin: "0 auto" }}
            >
              A place where professionals share what&apos;s working with AI.<br />
              Real-life, applicable examples.
            </p>
          </div>
        </div>

        <div className="container-narrow">
          {/* Coming soon card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-card)",
              padding: "32px",
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--brand)",
              }}
            >
              Coming Soon
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <a href="/" className="btn btn-primary btn-full">
              Explore Agents
            </a>
            <a href="/" className="btn btn-outline btn-full">
              Back to homepage
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
