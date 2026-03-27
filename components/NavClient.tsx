"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function NavClient() {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    window.location.href = "/";
  };

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="container">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            Prompt AI Agents
          </a>
          <ul className="nav-links">
            <li><a href="/agents">Agents</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/guides">Resources</a></li>
            <li><a href="/community">Community</a></li>
          </ul>
          <div className="nav-actions">
            {loading ? (
              /* Fixed-size placeholder to prevent layout shift — no visible content */
              <span className="nav-cta" style={{ opacity: 0, pointerEvents: "none" }}>
                Sign In
              </span>
            ) : user ? (
              /* Logged in: show first name + dropdown */
              <div className="nav-user-wrap" ref={dropdownRef}>
                <button
                  className="nav-user-btn"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  {user.firstName}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      marginLeft: "6px",
                      transform: dropdownOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="nav-dropdown">
                    <button className="nav-dropdown-item" onClick={handleLogout}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in: Sign In button */
              <a href="/login" className="nav-cta">
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
