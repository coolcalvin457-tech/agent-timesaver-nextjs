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
          <a href="#home" className="nav-logo">
            promptaiagents.com
          </a>
          <ul className="nav-links">
            <li><a href="#timesaver">AGENT: Timesaver</a></li>
            <li><a href="#content">Guides</a></li>
            <li><a href="#content">Courses</a></li>
            <li><a href="#content">Community</a></li>
            <li>
              <a href="#timesaver" className="nav-cta">
                Get Free Workflows
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
