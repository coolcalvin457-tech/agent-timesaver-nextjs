import HeroToolWrap from "@/components/HeroToolWrap";
import HeroButton from "@/components/HeroButton";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";
import PromptBuilderEmbed from "@/components/PromptBuilderEmbed";

export default function Home() {
  return (
    <>
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <NavClient />

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
        <section className="section section-dark" id="dream">
          <div className="container">
            <div style={{ maxWidth: "880px", margin: "0 auto", textAlign: "center" }}>
              <h2 className="heading-1" style={{ color: "#fff", marginBottom: "var(--section-head-gap)", lineHeight: "var(--section-headline-lh)", fontSize: "var(--section-headline-size)", letterSpacing: "var(--section-headline-ls)" }}>
                Imagine getting 5-10 hours back<br />every week.
              </h2>
              <p className="dream-body">
                Setting up personalized AI workflows is now within reach.<br />
                Reports, meeting preps, follow-ups, you name it.<br />
                In fact, you&apos;re closer than you think.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 3: Manifesto ─────────────────────────────────────── */}
        <section className="section" id="why" style={{ paddingBottom: "72px" }}>
          <div className="container">
            <div className="manifesto-split">
              {/* Left: eyebrow + headline */}
              <div>
                <div className="eyebrow" style={{ marginBottom: "20px" }}>The real barrier</div>
                <h2
                  className="heading-1"
                  style={{
                    fontSize: "var(--section-headline-size)",
                    lineHeight: "var(--section-headline-lh)",
                    letterSpacing: "var(--section-headline-ls)",
                    marginBottom: 0,
                  }}
                >
                  The hard part isn&apos;t getting started.
                </h2>
              </div>
              {/* Right: body paragraph */}
              <div className="manifesto-split-right">
                <p className="manifesto-body">
                  Anyone with internet today can use AI. Getting started is free.<br />
                  What keeps most people stuck isn&apos;t cost.<br />
                  It&apos;s that no one told them how to use it.<br />
                  One good prompt changes that.<br />
                  That&apos;s where your AI agent begins.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: AGENT: Prompt Builder ────────────────────────── */}
        <section className="section" id="prompt-builder" style={{ paddingTop: "80px", paddingBottom: "64px" }}>
          <div className="container">

            {/* Centered header */}
            <div style={{ maxWidth: "880px", margin: "0 auto", textAlign: "center", marginBottom: "40px" }}>
              <div className="eyebrow" style={{ marginBottom: "16px" }}>AGENT: Prompt Builder</div>
              <h2
                className="heading-1"
                style={{ marginBottom: "var(--section-head-gap)", fontSize: "var(--section-headline-size)", lineHeight: "var(--section-headline-lh)", letterSpacing: "var(--section-headline-ls)" }}
              >
                <span style={{ display: "block" }}>12 prompts built for</span>
                <span style={{ display: "block" }}>your exact job.</span>
              </h2>

              {/* Compact horizontal kit items */}
              <div className="prompt-builder-kit-row" style={{ marginBottom: "40px" }}>
                <div className="prompt-builder-kit-pill">
                  <span className="kit-item-check" style={{ fontSize: "0.75rem" }}>✓</span>
                  <span>Personalized Prompts</span>
                </div>
                <div className="prompt-builder-kit-pill">
                  <span className="kit-item-check" style={{ fontSize: "0.75rem" }}>✓</span>
                  <span>AI Profile</span>
                </div>
                <div className="prompt-builder-kit-pill">
                  <span className="kit-item-check" style={{ fontSize: "0.75rem" }}>✓</span>
                  <span>AI Systems Guide</span>
                </div>
              </div>

            </div>

            {/* Embedded prompt builder — job title input → navigates to full tool */}
            <PromptBuilderEmbed />

          </div>
        </section>

        {/* ── Section 5: The Transformation ───────────────────────────── */}
        <section className="section section-alt" id="transformation">
          <div className="container">
            <div className="eyebrow">What you walk away with</div>
            <h2
              className="heading-1"
              style={{ marginBottom: "48px", maxWidth: "480px" }}
            >
              3 things change when you start.
            </h2>

            <div className="outcomes-grid">
              <div className="outcome-card">
                <div className="outcome-label">Clarity</div>
                <div className="outcome-headline">Choose the right tools.</div>
                <p className="outcome-body">
                  You&apos;ll know exactly which AI tools are worth your time
                  and which ones aren&apos;t. No more experimenting in the dark.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">Capability</div>
                <div className="outcome-headline">Workflows built for your actual job.</div>
                <p className="outcome-body">
                  You&apos;ll gain real processes that you can try today. No
                  more generic advice that still keeps you guessing.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">Confidence</div>
                <div className="outcome-headline">Stop feeling behind.</div>
                <p className="outcome-body">
                  You&apos;ll start feeling and acting like the most capable
                  person in the room.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: The Guide ─────────────────────────────────────── */}
        <section className="section" id="about" style={{ paddingBottom: "80px" }}>
          <div className="container">
            <div style={{ maxWidth: "880px", margin: "0 auto", textAlign: "center" }}>
              <div className="eyebrow" style={{ marginBottom: "20px" }}>Your guide</div>
              <p className="guide-intro">Hi, I&apos;m Calvin.</p>
              <h2 className="guide-headline" style={{ marginBottom: "52px", marginTop: "28px" }}>
                <span style={{ display: "block" }}>I figured this out the hard way,</span>
                <span style={{ display: "block" }}>so you don&apos;t have to.</span>
              </h2>
              <p className="guide-body">
                I used to teach history and coach basketball.<br />
                No technical background. Nothing to do with software.<br />
                I spent 6 months learning how AI agents actually work.
              </p>
              <p className="guide-body">
                Now I&apos;m helping others apply AI to their specific jobs.<br />
                No starting from scratch.
              </p>
              <p className="guide-kicker" style={{ marginTop: "52px" }}>
                If a basketball coach can figure this out, so can you.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 7: Final CTA ─────────────────────────────────────── */}
        <section className="section" id="final-cta">
          <div className="container final-cta">
            <h2
              className="display"
              style={{ marginBottom: "16px" }}
            >
              Your job. Your tools. Your results.
            </h2>
            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                marginBottom: "36px",
                maxWidth: "480px",
                margin: "0 auto 36px",
              }}
            >
              Start with AGENT: Timesaver.<br />
              5 minutes. 5 workflows.
            </p>
            <HeroButton />
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Footer />
    </>
  );
}
