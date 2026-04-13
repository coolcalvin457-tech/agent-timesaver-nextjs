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
              style={{ marginBottom: "48px", fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", lineHeight: "var(--section-headline-lh)", letterSpacing: "var(--section-headline-ls)" }}
            >
              <span style={{ display: "block" }}>They all have personality.</span>
              <span style={{ display: "block" }}>Which one fits yours?</span>
            </h2>

            <div className="outcomes-grid">
              <div className="outcome-card">
                <div className="outcome-label">ChatGPT</div>
                <div className="outcome-headline">World-Class Writer</div>
                <p className="outcome-body">
                  Think Pulitzer Prize winner at your fingertips.
                  If you&apos;re already here, you picked a good one.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">Claude</div>
                <div className="outcome-headline">Amazing Coworker</div>
                <p className="outcome-body">
                  Ever wish you had your own personal assistant?
                  Well now you do, and they
                  are way overqualified.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">Copilot</div>
                <div className="outcome-headline">The Office</div>
                <p className="outcome-body">
                  If your company uses Microsoft, it&apos;s embedded into
                  everything. Careful the way you talk about AI around
                  the watercooler.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">Gemini</div>
                <div className="outcome-headline">Google Machine</div>
                <p className="outcome-body">
                  The world&apos;s most popular search engine now has AI
                  superpowers. It generates breathtaking images and viral
                  videos in minutes.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">Grok</div>
                <div className="outcome-headline">Elon Musk</div>
                <p className="outcome-body">
                  The friend who&apos;s up-to-date on all the breaking news
                  and latest trends. No, it won&apos;t always agree with you.
                </p>
              </div>
              <div className="outcome-card">
                <div className="outcome-label">Perplexity</div>
                <div className="outcome-headline">Deep Researcher</div>
                <p className="outcome-body">
                  While Google gives you ten blue links, this power tool
                  gives you a dossier before your coffee gets cold.
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
