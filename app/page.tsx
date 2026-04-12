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
                <span style={{ display: "block" }}>The first step toward creating</span>
                <span style={{ display: "block" }}>your own AI agent.</span>
              </h2>
            </div>

            {/* Full Q1 screen embedded. On Continue, navigates to /prompts at Q2 */}
            <PromptBuilderHomepageWrap />

          </div>
        </section>

        {/* ── Section 4: Manifesto (moved down from S62) ─────────────── */}
        <section className="section section-alt" id="why" style={{ paddingBottom: "72px" }}>
          <div className="container">
            <div className="manifesto-split">
              {/* Left: eyebrow + headline */}
              <div>
                <div className="eyebrow" style={{ marginBottom: "20px" }}>ABOUT US</div>
                <h2
                  className="heading-1"
                  style={{
                    fontSize: "var(--section-headline-size)",
                    lineHeight: "var(--section-headline-lh)",
                    letterSpacing: "var(--section-headline-ls)",
                    marginBottom: 0,
                  }}
                >
                  <span style={{ display: "block" }}>We&apos;re studying AI so</span>
                  <span style={{ display: "block" }}>you don&apos;t have to.</span>
                </h2>
              </div>
              {/* Right: body paragraph */}
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
        </section>

        {/* ── Section 5: The Transformation ───────────────────────────── */}
        <section className="section section-alt" id="transformation">
          <div className="container">
            <div className="eyebrow">What tool should I choose?</div>
            <h2
              className="heading-1"
              style={{ marginBottom: "48px", maxWidth: "480px" }}
            >
              <span style={{ display: "block" }}>Turn each card over to find out.</span>
              <span style={{ display: "block" }}>Which one suits you best.</span>
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
                <div className="outcome-headline">Time-savers built for your actual job.</div>
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
        <section className="section section-dark" id="final-cta" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "64px", paddingBottom: "64px" }}>
          <div className="container final-cta">
            <h2
              className="heading-1"
              style={{ marginBottom: "32px", color: "#FFFFFF", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: 1.2 }}
            >
              Your job. Your agents. Your results.
            </h2>
            <FinalCtaButton />
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Footer />
    </>
  );
}
