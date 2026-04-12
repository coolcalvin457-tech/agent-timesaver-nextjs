"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";

interface NavClientProps {
  /** Server-read paa_name cookie value. Prevents auth button blink. */
  initialName?: string | null;
  /** Apply dark-transparent styling for dark-background pages. */
  dark?: boolean;
}

export default function NavClient({ initialName, dark }: NavClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use initialName from server cookie for instant render.
  // Once AuthProvider resolves, `user` takes over.
  const displayName = user?.firstName ?? (loading ? initialName ?? null : null);

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
    <nav className={`nav${dark ? " nav-dark" : ""}${scrolled ? " scrolled" : ""}`}>
      <div className="container">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            Prompt AI Agents
          </a>
          <ul className="nav-links">
            <li><a href="/about">About Us</a></li>
            <li><a href="/agents">Agents</a></li>
            <li><a href="/pricing">Pricing</a></li>
            <li><a href="/blog">Blog</a></li>
          </ul>
          <div className="nav-actions">
            {displayName ? (
              /* Logged in (or server cookie says logged in): show name + dropdown */
              <div className="nav-user-wrap" ref={dropdownRef}>
                <button
                  className="nav-user-btn"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  {displayName}
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
              /* Not logged in */
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
