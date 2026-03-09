"use client";

import { useEffect, useState } from "react";

export default function NavClient() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="container">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            promptaiagents.com
          </a>
          <ul className="nav-links">
            <li><a href="/tools">Tools</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/guides">Resources</a></li>
            <li><a href="/community">Community</a></li>
          </ul>
          <div className="nav-actions">
            <a href="/" className="nav-cta">
              Get Free Workflows
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
