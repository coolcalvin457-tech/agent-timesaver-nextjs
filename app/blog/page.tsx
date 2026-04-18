import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog | Prompt AI Agents",
  description:
    "Practical AI skills for non-technical people. Real workflows, honest takes, and a clear path forward.",
  openGraph: {
    title: "Blog | Prompt AI Agents",
    description:
      "Practical AI skills for non-technical people. Real workflows, honest takes, and a clear path forward.",
    url: "https://promptaiagents.com/blog",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

export default function BlogPage() {
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
        {/* Page header */}
        <div className="container">
          <div style={{ paddingTop: "80px", marginBottom: "40px", textAlign: "center" }}>
            <h1 className="heading-1" style={{ marginBottom: "14px", fontFamily: "var(--font-sans)", fontWeight: 600, letterSpacing: "-0.02em", fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05 }}>
              Blog
            </h1>
            <p
              className="hero-subheadline"
              style={{ margin: "0 auto", fontSize: "clamp(1.125rem, 2vw, 1.375rem)", fontWeight: 400 }}
            >
              Built for real jobs. Not demos.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
