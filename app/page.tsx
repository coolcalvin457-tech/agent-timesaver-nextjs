import TimesaverTool from "@/components/TimesaverTool";
import HeroButton from "@/components/HeroButton";
import NavClient from "@/components/NavClient";
import Footer from "@/components/Footer";

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
                <div className="browser-chrome hero-tool-dark">
                  <div className="browser-bar">
                    <div className="browser-dot browser-dot-red" />
                    <div className="browser-dot browser-dot-yellow" />
                    <div className="browser-dot browser-dot-green" />
                    <div className="browser-url">promptaiagents.com/timesaver</div>
                  </div>
                  <TimesaverTool />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Section 2: Dream / Aspiration ───────────────────────────── */}
        <section className="section section-dark" id="dream" style={{ paddingBottom: "72px" }}>
          <div className="container-narrow">
            <h2 className="heading-1" style={{ color: "#fff", marginBottom: "24px" }}>
              Imagine getting 5 to 10 hours back every week.
            </h2>
            <p className="dream-body">
              Setting up personalized AI workflows is now within reach. Reports,
              meeting preps, follow-ups, you name it. Here&apos;s how to begin
              with a few prompts.
            </p>
          </div>
        </section>

        {/* ── Section 4: AGENT: Prompt Builder ────────────────────────── */}
        <section className="section" id="prompt-builder" style={{ paddingTop: "72px", paddingBottom: "80px" }}>
          <div className="container">
            <div className="prompt-builder-layout">

              {/* Left: copy */}
              <div>
                <div className="eyebrow" style={{ marginBottom: "16px" }}>AGENT: Prompt Builder</div>
                <h2
                  className="heading-1"
                  style={{ marginBottom: "16px" }}
                >
                  12 prompts tailored for your exact job.
                </h2>
                <p
                  className="body-lg"
                  style={{
                    color: "var(--text-secondary)",
                    marginBottom: "32px",
                  }}
                >
                  Answer a few questions about your job. Walk away with 12
                  ready-to-use prompts, a personal AI Profile, and a
                  step-by-step guide for building your AI system.
                </p>
                <a href="/prompt-builder" className="btn btn-primary btn-lg">
                  Get Started →
                </a>
              </div>

              {/* Right: kit preview card */}
              <a href="/prompt-builder" className="kit-preview-card" style={{ textDecoration: "none", cursor: "pointer", display: "block" }}>
                <div className="kit-preview-label">What&apos;s included:</div>

                <div className="kit-item">
                  <div className="kit-item-check">✓</div>
                  <div className="kit-item-text">
                    <strong>12 personalized prompts</strong> across 4 work
                    categories. Built around your role, not a generic template.
                  </div>
                </div>

                <div className="kit-item">
                  <div className="kit-item-check">✓</div>
                  <div className="kit-item-text">
                    <strong>Your AI Profile.</strong> Add it to ChatGPT, Claude, or
                    Gemini&apos;s memory so every conversation begins with full
                    context.
                  </div>
                </div>

                <div className="kit-item">
                  <div className="kit-item-check">✓</div>
                  <div className="kit-item-text">
                    <strong>Build Your AI System guide.</strong> Folder
                    structure, tool recommendations, and exactly where to
                    put everything.
                  </div>
                </div>

                <div className="kit-item">
                  <div className="kit-item-check">✓</div>
                  <div className="kit-item-text">
                    <strong>One-click copy buttons</strong> on every prompt.
                    Paste directly into any AI tool, no reformatting needed.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Section 5: The Guide ─────────────────────────────────────── */}
        <section className="section" id="about" style={{ paddingTop: "72px" }}>
          <div className="container">
            <div className="eyebrow">Your guide</div>
            <div className="guide-layout">
              <div className="guide-avatar" aria-hidden="true">
                🏀
              </div>
              <div>
                <h2 className="guide-headline">
                  Hi, I&apos;m Calvin. I figured this out the hard way, so you
                  don&apos;t have to.
                </h2>
                <p className="guide-body">
                  I used to teach history and coach basketball. No technical
                  background. Nothing to do with software. I spent 6 months
                  learning how AI agents actually work.
                </p>
                <p className="guide-body">
                  Now I&apos;m sharing what I know to help others apply AI to
                  their specific jobs, without starting from scratch.
                </p>
                <p className="guide-kicker">
                  If a basketball coach can figure this out, so can you.
                </p>
              </div>
            </div>
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

        {/* ── Section 6: How It Works ──────────────────────────────────── */}
        <section className="section" id="how-it-works">
          <div className="container">
            <div className="eyebrow">How it works</div>
            <h2
              className="heading-1"
              style={{ marginBottom: "48px" }}
            >
              Three steps. No fluff.
            </h2>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">01 · Learn</div>
                <div className="step-headline">Start with the fundamentals.</div>
                <p className="step-body">
                  Clear guides and short videos that make AI make sense for your
                  specific world, not a developer&apos;s. No jargon. No wasted
                  time.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">02 · Apply</div>
                <div className="step-headline">Use the tools.</div>
                <p className="step-body">
                  AGENT: Timesaver shows you exactly what AI workflows fit your
                  job. Every resource here is built for action, not passive
                  learning.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">03 · Transform</div>
                <div className="step-headline">Watch the hours add up.</div>
                <p className="step-body">
                  Each workflow you adopt gives you back time you can reinvest.
                  That&apos;s how busy people build momentum. One hour at a time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 8: Content Preview ───────────────────────────────── */}
        <section className="section section-dark" id="content">
          <div className="container">
            <div className="eyebrow eyebrow-light">What&apos;s inside</div>
            <h2
              className="heading-1"
              style={{ color: "#fff", marginBottom: "12px" }}
            >
              This is just the beginning.
            </h2>
            <p
              className="body-lg"
              style={{
                color: "rgba(255,255,255,0.6)",
                marginBottom: "48px",
                maxWidth: "540px",
              }}
            >
              Free resources, more tools on the way, and a community of people learning
              alongside you. Everything is built around one idea: real AI skills
              for real jobs.
            </p>

            <div className="content-grid">
              <div className="content-card">
                <div className="content-label">Written Guides</div>
                <p className="content-body">
                  Step-by-step breakdowns for every workflow. Free, searchable,
                  updated regularly.
                </p>
              </div>
              <div className="content-card">
                <div className="content-label">More AGENT Tools</div>
                <p className="content-body">
                  New tools built for specific workflows are in progress. Same
                  approach: start with your job, get something you can actually
                  use.
                </p>
                <span className="coming-soon">Coming soon</span>
              </div>
              <div className="content-card">
                <div className="content-label">Community</div>
                <p className="content-body">
                  Ask questions. Share wins. Stay sharp. A place to learn with
                  people who are figuring this out alongside you.
                </p>
                <span className="coming-soon">Coming soon</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 9: Final CTA ─────────────────────────────────────── */}
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
