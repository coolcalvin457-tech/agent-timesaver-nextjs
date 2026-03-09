export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">

          {/* Brand */}
          <div>
            <div className="footer-brand-name">promptaiagents.com</div>
            <div className="footer-tagline">Built for real jobs. Not demos.</div>
          </div>

          {/* Tools */}
          <div>
            <div className="footer-col-label">Tools</div>
            <ul className="footer-col-links">
              <li><a href="/#timesaver">AGENT: Timesaver</a></li>
              <li><a href="/prompt-builder">AGENT: Prompt Builder</a></li>
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
            © 2026 promptaiagents.com. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
