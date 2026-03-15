import type { Metadata } from "next";
import NavClient from "@/components/NavClient";

export const metadata: Metadata = {
  title:
    "Your Team Thinks You're a Tech Wizard. All You Did Was Learn One Workflow. | Prompt AI Agents",
  description:
    "Your meeting ends. One prompt to AI gives you a summary, slide breakdown, and follow-up email before lunch. Here's the exact workflow.",
  openGraph: {
    title:
      "Your Team Thinks You're a Tech Wizard. All You Did Was Learn One Workflow.",
    description:
      "Your meeting ends. One prompt to AI gives you a summary, slide breakdown, and follow-up email before lunch.",
    url: "https://promptaiagents.com/blog/your-team-thinks-youre-a-tech-wizard",
    siteName: "Prompt AI Agents",
    type: "article",
  },
};

export default function PostPage() {
  return (
    <>
      <NavClient />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
        }}
      >
        {/* Back link */}
        <div className="container-narrow">
          <div style={{ paddingTop: "32px", marginBottom: "40px" }}>
            <a
              href="/blog"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "color 0.15s ease",
              }}
            >
              ← Back to Blog
            </a>
          </div>
        </div>

        {/* Post header */}
        <div className="container-narrow">
          <div style={{ marginBottom: "48px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
                flexWrap: "wrap",
              }}
            >
              <span className="blog-tag">Non-Technical AI Skills</span>
              <span className="caption" style={{ color: "var(--text-muted)" }}>
                March 9, 2026
              </span>
              <span className="caption" style={{ color: "var(--text-muted)" }}>
                · 4 min read
              </span>
            </div>
            <h1
              className="display"
              style={{
                marginBottom: "0",
                maxWidth: "720px",
                lineHeight: 1.1,
              }}
            >
              Your Team Thinks You&apos;re a Tech Wizard.<br />
              All You Did Was Learn One Workflow.
            </h1>
          </div>

          {/* Divider */}
          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border)",
              marginBottom: "48px",
            }}
          />
        </div>

        {/* Post body */}
        <div className="container-narrow">
          <div className="blog-body">

            {/* Section 1: Hook */}
            <div className="blog-section">
              <p>
                Imagine a world where your entire team thinks you&apos;re a tech
                wizard. But all you did was learn one workflow.
              </p>
              <p>
                Your team meeting ends. Everyone logs off. You paste the
                transcript from the meeting into AI. After one simple prompt,
                you walk away and it&apos;s time for lunch.
              </p>
              <p>
                As you&apos;re eating lunch, your team members all receive an
                email from you. Subject: Meeting Recap (Today&apos;s Date)
              </p>
              <p>
                The email includes a clean summary of what you all talked about,
                a slide-by-slide breakdown ready to present, and a follow-up
                email draft with every key takeaway highlighted.
              </p>
              <p>
                That&apos;s not an exaggeration. That&apos;s your Friday
                afternoon. And now you can enjoy the weekend.
              </p>
            </div>

            {/* Section 2: Workflow */}
            <div className="blog-section">
              <p>
                Platforms like Zoom, Google Meet, and Microsoft Teams generate
                transcripts from meetings automatically. Once the call ends,
                your transcript is already waiting for you.
              </p>
              <p>
                Open your AI tool of choice, paste in the transcript, and use a
                prompt like this:
              </p>
              <div className="blog-prompt-box">
                <p>
                  Here&apos;s the transcript from my team meeting today. I need
                  three things:
                </p>
                <ol style={{ marginTop: "12px", paddingLeft: "20px" }}>
                  <li>Clean summary of everything we discussed.</li>
                  <li>Slide presentation of 5-7 key takeaways.</li>
                  <li>
                    Draft a follow-up email I can send to everyone on the call.
                    Include 1-2 next steps.
                  </li>
                </ol>
              </div>
              <p>
                That last part is worth pausing on. You handed AI a full meeting
                transcript and it pulled out the 1 to 2 things your team
                actually needs to do next. No digging through notes. No trying
                to remember what was decided. It read the whole thing so you
                didn&apos;t have to.
              </p>
              <p>
                Then you proofread the draft, copy &amp; paste, and hit send.
              </p>
              <p>
                Your coworkers will have it in their inbox before they get a
                chance to open their lunch.
              </p>
            </div>

            {/* Section 3: Horizon */}
            <div className="blog-section">
              <p>Meetings are just the beginning.</p>
              <p>
                Any time you have a document and need finished work from it,
                this same move applies. Whether it&apos;s a proposal, a project
                brief, or a performance review, tell AI what your desired
                outcome should look like and it will do the heavy lifting.
              </p>
              <p>The final document may change, but the workflow stays the same.</p>
            </div>

            {/* Section 4: CTA text */}
            <div className="blog-section">
              <p>
                Continue to explore the website for more relevant tools and
                resources. And let me know how you start implementing AI at your
                job.
              </p>
            </div>

          </div>

          {/* CTA card */}
          <div className="blog-cta-card">
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(30,122,184,0.9)",
                marginBottom: "16px",
              }}
            >
              Free tool
            </div>
            <h2
              style={{
                fontSize: "1.375rem",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
                marginBottom: "12px",
                maxWidth: "480px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              See which AI workflows fit your job.
            </h2>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.65,
                marginBottom: "28px",
                maxWidth: "400px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Enter your job title. Answer a few questions. Walk away with 5
              AI workflows built for your specific role and a real estimate of
              the time you could get back.
            </p>
            <a href="/#timesaver" className="btn btn-primary">
              Try AGENT: Timesaver — free →
            </a>
          </div>

        </div>

        {/* Keep reading */}
        <div className="container-narrow">
          <div style={{ marginTop: "64px", paddingBottom: "24px" }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Keep reading
            </div>
            <a
              href="/blog/your-ai-has-never-seen-your-best-work"
              className="blog-next-link"
            >
              <span>Your AI Has Never Seen Your Best Work. Why Not Show It?</span>
              <span style={{ color: "var(--cta)", marginLeft: "16px", flexShrink: 0 }}>→</span>
            </a>
            <a
              href="/blog/build-once-never-re-explain-ai"
              className="blog-next-link"
            >
              <span>Build Once and You&apos;ll Never Have to Re-Explain to AI Again</span>
              <span style={{ color: "var(--cta)", marginLeft: "16px", flexShrink: 0 }}>→</span>
            </a>
          </div>
        </div>

      </main>
    </>
  );
}
