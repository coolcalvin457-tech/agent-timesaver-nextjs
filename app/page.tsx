import TimesaverTool from "@/components/TimesaverTool";
import NavClient from "@/components/NavClient";

export default function Home() {
  return (
    <>
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <NavClient />

      <main>
        {/* ── Section 1: Hero ─────────────────────────────────────────── */}
        <section className="hero" id="home">
          <div className="container">
            <h1 className="hero-headline">
              Everyone&apos;s talking about AI agents.
              Here&apos;s how to actually use them.
            </h1>
            <p className="hero-subheadline">
              Start with your job title. Get 5 AI workflows built for your exact
              role. See how many hours you could save every week. Free.
            </p>
            <a href="#timesaver" className="btn btn-primary btn-lg">
              Find My AI Workflows →
            </a>
          </div>
        </section>

        {/* ── Section 2: Dream / Aspiration ───────────────────────────── */}
        <section className="section section-dark" id="dream">
          <div className="container-narrow">
            <div className="section-label section-label-light">Take back your time.</div>
            <h2 className="heading-1" style={{ color: "#fff", marginBottom: "24px" }}>
              Imagine getting 5 to 10 hours back every week.
            </h2>
            <p className="dream-body">
              No more agonizing over emails, reports, meeting preps, follow-ups,
              or to-do lists. You don&apos;t have to be technical to get there.
              Just think about what you&apos;d do with all that extra time.{" "}
              <strong>Now you know what&apos;s possible.</strong>
              <br />
              <strong>Let me show you where to begin.</strong>
            </p>
          </div>
        </section>

        {/* ── Section 3: AGENT: Timesaver ─────────────────────────────── */}
        <section className="section section-alt" id="timesaver">
          <div className="container">
            <div className="section-label">Free tool</div>
            <h2
              className="heading-1"
              style={{ marginBottom: "12px", maxWidth: "520px" }}
            >
              See exactly how AI fits in your job.
            </h2>
            <p
              className="body-lg"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "540px",
                marginBottom: "48px",
              }}
            >
              Enter your job title. Answer a few questions. Walk away with 5
              workflows built for your specific role and a real estimate of how
              much time you could save.
            </p>

            {/* Browser chrome wrapper */}
            <div className="browser-chrome">
              <div className="browser-bar">
                <div className="browser-dot browser-dot-red" />
                <div className="browser-dot browser-dot-yellow" />
                <div className="browser-dot browser-dot-green" />
                <div className="browser-url">promptaiagents.com/timesaver</div>
              </div>
              <TimesaverTool />
            </div>
          </div>
        </section>

        {/* ── Section 4: AGENT: Prompt Builder ────────────────────────── */}
        <section className="section" id="prompt-builder">
          <div className="container">
            <div className="section-label">AGENT: Prompt Builder</div>
            <div className="prompt-builder-layout">

              {/* Left: copy */}
              <div>
                <div style={{ marginBottom: "20px" }}>
                  <span className="price-badge">$4.99 · one-time purchase</span>
                </div>
                <h2
                  className="heading-1"
                  style={{ marginBottom: "16px", maxWidth: "440px" }}
                >
                  12 prompts built for your exact job. Ready to copy.
                </h2>
                <p
                  className="body-lg"
                  style={{
                    color: "var(--text-secondary)",
                    maxWidth: "420px",
                    marginBottom: "32px",
                  }}
                >
                  Answer 4 questions about how you work. Walk away with a
                  complete AI Prompt Kit: 12 ready-to-use prompts, a personal
                  AI Profile, and a step-by-step guide to building your AI
                  system.
                </p>
                <a href="/prompt-builder" className="btn btn-primary btn-lg">
                  Get Started →
                </a>
                <p
                  style={{
                    marginTop: "14px",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  One-time payment. No subscription. Yours to keep.
                </p>
              </div>

              {/* Right: kit preview card */}
              <div className="kit-preview-card">
                <div className="kit-preview-label">What&apos;s in your kit</div>

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
                    <strong>Your AI Profile paragraph.</strong> Paste it into
                    ChatGPT, Claude, or Gemini and every conversation starts
                    with your full context.
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
        <section className="section" id="about">
          <div className="container">
            <div className="section-label">Your guide</div>
            <div className="guide-layout">
              <div className="guide-avatar" aria-hidden="true">
                🏀
              </div>
              <div>
                <h2 className="guide-headline">
                  I&apos;m Calvin. I figured this out the hard way so you
                  don&apos;t have to.
                </h2>
                <p className="guide-body">
                  I came from basketball coaching, not software. No technical
                  background. No shortcuts. I spent 6 months teaching myself how
                  AI agents actually work and how to use them in real work, not
                  just demos.
                </p>
                <p className="guide-body">
                  Now I translate everything I learned into plain language so you
                  can skip the frustrating part and start saving real time.
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
            <div className="section-label">What you walk away with</div>
            <h2
              className="heading-1"
              style={{ marginBottom: "48px", maxWidth: "480px" }}
            >
              Three things change when you learn this.
            </h2>

            <div className="outcomes-grid">
              <div className="outcome-card">
                <div className="outcome-label">Clarity</div>
                <div className="outcome-headline">You know exactly which tools are worth your time.</div>
                <p className="outcome-body">
                  You know exactly which AI tools are worth your time and which
                  ones aren&apos;t. No more experimenting in the dark.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">Capability</div>
                <div className="outcome-headline">Workflows built for your actual job.</div>
                <p className="outcome-body">
                  You have workflows that fit your actual job. Not generic tips
                  from a blog post. Real processes you can use tomorrow.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">Confidence</div>
                <div className="outcome-headline">You stop feeling behind.</div>
                <p className="outcome-body">
                  You stop feeling behind. You start feeling like the most
                  capable person in the room.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: How It Works ──────────────────────────────────── */}
        <section className="section" id="how-it-works">
          <div className="container">
            <div className="section-label">How it works</div>
            <h2
              className="heading-1"
              style={{ marginBottom: "48px" }}
            >
              Three steps. No fluff.
            </h2>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">01 — Learn</div>
                <div className="step-headline">Start with the fundamentals.</div>
                <p className="step-body">
                  Clear guides and short videos that make AI make sense for your
                  specific world, not a developer&apos;s. No jargon. No wasted
                  time.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">02 — Apply</div>
                <div className="step-headline">Use the tools.</div>
                <p className="step-body">
                  AGENT: Timesaver shows you exactly what AI workflows fit your
                  job. Every resource here is built for action, not passive
                  learning.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">03 — Transform</div>
                <div className="step-headline">Watch the hours add up.</div>
                <p className="step-body">
                  Each workflow you adopt gives you back time you can reinvest.
                  That&apos;s how busy people build leverage — one hour at a
                  time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 7: Lead Magnet CTA ───────────────────────────────── */}
        <section className="section section-brand" id="get-started">
          <div className="container">
            <div className="cta-section-inner">
              <div className="section-label section-label-brand">Start here</div>
              <h2
                className="heading-1"
                style={{ color: "#fff", marginBottom: "16px" }}
              >
                It&apos;s free. It&apos;s fast. It&apos;s built for your exact
                job.
              </h2>
              <p
                className="body-lg"
                style={{
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "32px",
                  maxWidth: "480px",
                }}
              >
                AGENT: Timesaver takes under 5 minutes. You&apos;ll walk away
                with 5 AI workflows personalized to your role and a clear
                picture of the time you could reclaim every week.
              </p>
              <a href="#timesaver" className="btn btn-dark btn-lg">
                Get My Free Workflows →
              </a>
              <p
                style={{
                  marginTop: "16px",
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                No account required. No credit card. Just useful.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 8: Content Preview ───────────────────────────────── */}
        <section className="section section-dark" id="content">
          <div className="container">
            <div className="section-label section-label-light">What&apos;s inside</div>
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
              Free resources, video courses, and a community of people learning
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
                <div className="content-label">Video Courses</div>
                <p className="content-body">
                  Go deeper on the skills that matter most. Learn at your pace,
                  apply the same day.
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
              Start with AGENT: Timesaver. Five minutes. Five workflows.
              Completely free.
            </p>
            <a href="#timesaver" className="btn btn-primary btn-lg">
              Get My Free Workflows →
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "4px",
                }}
              >
                promptaiagents.com
              </div>
              <div className="footer-tagline">Built for real jobs. Not demos.</div>
            </div>

            <nav>
              <ul className="footer-nav">
                <li><a href="#home">Home</a></li>
                <li><a href="#timesaver">AGENT: Timesaver</a></li>
                <li><a href="#prompt-builder">AGENT: Prompt Builder</a></li>
                <li><a href="/blog">Blogs</a></li>
                <li><a href="/guides">Guides</a></li>
                <li><a href="/community">Community</a></li>
              </ul>
            </nav>

            <div className="footer-legal">
              © 2026 promptaiagents.com. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
