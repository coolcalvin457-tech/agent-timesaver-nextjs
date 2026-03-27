"use client";

// ─── LoginForm ───────────────────────────────────────────────────────────────
//
// Email-first login flow:
//   1. User enters email → submit
//   2. If existing user: server sends magic link → "Check your email"
//   3. If new user: server returns needsSignup → show name fields → resubmit
//
// After submit: "Check your email" screen with resend.

import { useState } from "react";

type Screen = "email" | "signup" | "check-email";

interface LoginFormProps {
  /** Optional redirect path after login (passed to magic link). */
  redirectTo?: string;
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const [screen, setScreen] = useState<Screen>("email");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(false);

  const submitLogin = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
      }),
    });

    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  };

  // ── Email-only submit (step 1) ───────────────────────────────────────────

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Email is required.");
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await submitLogin();

      if (ok) {
        // Existing user: link sent
        setScreen("check-email");
      } else if (data.error?.includes("First name is required")) {
        // New user: show signup fields
        setScreen("signup");
      } else {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Signup submit (step 2 for new users) ─────────────────────────────────

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim()) {
      setErrorMsg("First name is required.");
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await submitLogin();

      if (ok) {
        setScreen("check-email");
      } else {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend handler ───────────────────────────────────────────────────────

  const handleResend = async () => {
    if (resendCooldown) return;
    setResendCooldown(true);
    setErrorMsg("");

    try {
      const { ok, data } = await submitLogin();
      if (!ok) {
        setErrorMsg(data.error || "Could not resend. Please try again.");
      }
    } catch {
      setErrorMsg("Could not resend. Please try again.");
    }

    // 60-second cooldown
    setTimeout(() => setResendCooldown(false), 60_000);
  };

  // ── Check your email screen ────────────────────────────────────────────

  if (screen === "check-email") {
    return (
      <div className="login-card">
        <div className="login-icon-wrap" style={{ background: "#DCFCE7" }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A7A4A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-10 6L2 7" />
          </svg>
        </div>
        <h1 className="login-headline">Check your email</h1>
        <p className="login-subtext">
          We sent a sign-in link to <strong>{email}</strong>.
        </p>
        <p className="login-subtext" style={{ marginTop: "4px" }}>
          It expires in 15 minutes.
        </p>
        <button
          className="login-resend-btn"
          onClick={handleResend}
          disabled={resendCooldown}
        >
          {resendCooldown ? "Link sent" : "Resend the link"}
        </button>
        {errorMsg && <p className="login-error">{errorMsg}</p>}
      </div>
    );
  }

  // ── Signup form (new users only) ───────────────────────────────────────

  if (screen === "signup") {
    return (
      <div className="login-card">
        <h1 className="login-headline">Create your account</h1>
        <p className="login-subtext">
          Looks like you&apos;re new here. Tell us your name and we&apos;ll send
          a sign-in link to <strong>{email}</strong>.
        </p>

        <form onSubmit={handleSignupSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-firstName" className="login-label">
              First name
            </label>
            <input
              id="login-firstName"
              type="text"
              className="input"
              placeholder="Sarah"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-jobTitle" className="login-label">
              Job title{" "}
              <span style={{ color: "var(--text-muted, #888886)", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <input
              id="login-jobTitle"
              type="text"
              className="input"
              placeholder="HR Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              autoComplete="organization-title"
            />
          </div>

          {errorMsg && <p className="login-error">{errorMsg}</p>}

          <button
            type="submit"
            className="btn btn-dark-cta btn-full"
            disabled={loading}
            style={{ marginTop: "8px" }}
          >
            {loading ? "Sending..." : "Send me a sign-in link"}
          </button>

          <button
            type="button"
            className="login-resend-btn"
            onClick={() => {
              setScreen("email");
              setErrorMsg("");
            }}
            style={{ marginTop: "8px" }}
          >
            Use a different email
          </button>
        </form>
      </div>
    );
  }

  // ── Email-first form (default) ─────────────────────────────────────────

  return (
    <div className="login-card">
      <h1 className="login-headline">Sign in to Prompt AI Agents</h1>
      <p className="login-subtext">
        Enter your email and we&apos;ll send you a sign-in link.
      </p>

      <form onSubmit={handleEmailSubmit} className="login-form">
        <div className="login-field">
          <label htmlFor="login-email" className="login-label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className="input"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </div>

        {errorMsg && <p className="login-error">{errorMsg}</p>}

        <button
          type="submit"
          className="btn btn-dark-cta btn-full"
          disabled={loading}
          style={{ marginTop: "8px" }}
        >
          {loading ? "Sending..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
