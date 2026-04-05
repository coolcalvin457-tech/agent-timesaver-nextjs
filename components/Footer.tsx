export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">

          {/* Brand */}
          <div>
            <div className="footer-brand-name">Prompt AI Agents</div>
            <div className="footer-tagline">Built for real jobs. Not demos.</div>
          </div>

          {/* Agents */}
          <div>
            <div className="footer-col-label">Agents</div>
            <ul className="footer-col-links">
              <li><a href="/prompts">AGENT: Prompts</a></li>
              <li><a href="/workflow">AGENT: Workflow</a></li>
              <li><a href="/industry">AGENT: Industry</a></li>
              <li><a href="/spreadsheets">AGENT: Spreadsheets</a></li>
              <li><a href="/#timesaver">AGENT: Timesaver</a></li>
            </ul>
          </div>

          {/* Content */}
          <div>
            <div className="footer-col-label">Content</div>
            <ul className="footer-col-links">
              <li><a href="/blog">Blog</a></li>
              <li><a href="/guides">Resources</a></li>
              <li><a href="/community">Community</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-legal">
            © 2026 Prompt AI Agents. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
