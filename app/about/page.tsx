import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About | Prompt AI Agents",
  description:
    "We're studying AI so that you don't have to. Prompt AI Agents helps non-technical professionals apply AI at their specific job.",
  openGraph: {
    title: "About | Prompt AI Agents",
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
              About
            </h1>
            <p
              className="hero-subheadline"
              style={{
                margin: "0 auto",
                fontSize: "clamp(1.125rem, 2vw, 1.375rem)",
                fontWeight: 400,
                maxWidth: "none",
                whiteSpace: "nowrap",
              }}
            >
              Helping AI beginners customize their own AI.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
