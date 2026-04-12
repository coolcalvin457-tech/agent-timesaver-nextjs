import HeroToolWrap from "@/components/HeroToolWrap";
import HeroButton from "@/components/HeroButton";
import ScrollChevron from "@/components/ScrollChevron";
import FinalCtaButton from "@/components/FinalCtaButton";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PromptBuilderHomepageWrap from "@/components/PromptBuilderHomepageWrap";

export default function Home() {
  return (
    <>
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <Nav />

      <main>
        {/* ── Section 1: Hero ─────────────────────────────────────────── */}
        <section className="hero" id="home">
          <div className="container">
            <div className="hero-inner">

              {/* Left: copy */}
              <div className="hero-copy">
                <h1 className="hero-headline">
                  How to Actually<br />
                  Create Your<br />
                  Own AI Agent.
                </h1>
                <p className="hero-subheadline">
                  Less intimidating than it sounds.<br />More useful than you think.
                </p>
                <HeroButton />
              </div>

              {/* Right: visual slot — tool embed */}
              <div className="hero-visual" style={{ paddingTop: "56px" }}>
                <HeroToolWrap />
              </div>

            </div>
          </div>
        </section>

        {/* ── Section 2: Dream / Aspiration ───────────────────────────── */}
        <section className="section section-dark" id="dream" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "64px", paddingBottom: "64px" }}>
          <div className="container">
            <div style={{ maxWidth: "880px", margin: "0 auto", textAlign: "center" }}>
              <h2 className="heading-1" style={{ color: "#fff", marginBottom: "var(--section-head-gap)", lineHeight: "var(--section-headline-lh)", fontSize: "var(--section-headline-size)", letterSpacing: "var(--section-headline-ls)" }}>
                Imagine getting 5-10 hours back<br />every week.
              </h2>
              <p className="dream-body">
                You don&apos;t have to be technical to be good with AI.<br />
                We make individualized agents accessible.<br />
                Start prompting and customizing.<br />
                Your team of <span style={{ color: "#FFFFFF" }}>AI coworkers</span>.
              </p>

              {/* Scroll hint chevron */}
              <ScrollChevron />
            </div>
          </div>
        </section>

        {/* ── Section 3: AGENT: Prompts (moved up from S62) ───── */}
        <section className="section" id="prompts" style={{ paddingTop: "80px", paddingBottom: "64px" }}>
          <div className="container">

            {/* Centered header */}
            <div style={{ maxWidth: "880px", margin: "0 auto", textAlign: "center", marginBottom: "40px" }}>
              <div className="eyebrow" style={{ marginBottom: "16px" }}>START HERE</div>
              <h2
                className="heading-1"
                style={{ marginBottom: 0, fontSize: "var(--section-headline-size)", lineHeight: "var(--section-headline-lh)", letterSpacing: "var(--section-headline-ls)" }}
              >
                <span style={{ display: "block" }}>The first step to creating</span>
                <span style={{ display: "block" }}>your own AI agent.</span>
              </h2>
            </div>

            {/* Full Q1 screen embedded. On Continue, navigates to /prompts at Q2 */}
            <PromptBuilderHomepageWrap />

          </div>
        </section>

        {/* ── Section 4: Find Your AI Match ────────────────────────────── */}
        <section className="section section-alt" id="transformation">
          <div className="container">
            <div className="eyebrow">Find Your AI Match</div>
            <h2
              className="heading-1"
              style={{ marginBottom: "48px", fontSize: "var(--section-headline-size)", lineHeight: "var(--section-headline-lh)", letterSpacing: "var(--section-headline-ls)" }}
            >
              <span style={{ display: "block" }}>They all have a personality.</span>
              <span style={{ display: "block" }}>Which one fits yours?</span>
            </h2>

            <div className="outcomes-grid">
              <div className="outcome-card">
                <div className="outcome-label">The All-Rounder</div>
                <div className="outcome-headline">Good at everything. Great starting point.</div>
                <p className="outcome-body">
                  ChatGPT handles the widest range of tasks without breaking a sweat.
                  Writing, brainstorming, summarizing, coding. If you want one tool
                  that does a little of everything, this is where you start.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">The Writer</div>
                <div className="outcome-headline">Thoughtful. Detailed. Built for long work.</div>
                <p className="outcome-body">
                  Claude shines when the task needs depth: long documents, careful
                  analysis, nuanced writing. If your work lives in reports, memos,
                  and strategy docs, Claude will feel like the sharpest person on your team.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">The Google Native</div>
                <div className="outcome-headline">Lives where your work already lives.</div>
                <p className="outcome-body">
                  Gemini connects directly to Gmail, Docs, and Drive. If your entire
                  workflow runs through Google, Gemini meets you there instead of making
                  you copy and paste between tabs.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">The Real-Time Pulse</div>
                <div className="outcome-headline">Knows what happened five minutes ago.</div>
                <p className="outcome-body">
                  Grok pulls from live data and trends in real time. If your job depends
                  on staying current with news, markets, or what people are talking about
                  right now, Grok keeps you plugged in.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">The Researcher</div>
                <div className="outcome-headline">Answers with receipts.</div>
                <p className="outcome-body">
                  Perplexity searches the internet and cites its sources. If you spend
                  time Googling, cross-checking, and verifying before you can move forward,
                  Perplexity does that legwork for you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 7: Final CTA ─────────────────────────────────────── */}
        <section className="section section-dark" id="final-cta" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "64px", paddingBottom: "64px" }}>
          <div className="container final-cta">
            <h2
              className="display"
              style={{ marginBottom: "24px", color: "#FFFFFF", fontSize: "clamp(2rem, 4vw, 3rem)", whiteSpace: "nowrap" }}
            >
              Your Work<span style={{ fontSize: "0.7em" }}>.</span> Your Agents<span style={{ fontSize: "0.7em" }}>.</span> Your Results<span style={{ fontSize: "0.7em" }}>.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1rem", lineHeight: 1.6, marginBottom: "32px", maxWidth: "400px", margin: "0 auto 32px" }}>
              Start with a free agent. See what changes.
            </p>
            <FinalCtaButton />
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Footer />
    </>
  );
}
