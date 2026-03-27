// ─── /login ──────────────────────────────────────────────────────────────────
//
// Login/signup page. Single form, always shows all fields (Option A).
// Reads ?redirect= param to pass through to magic link for post-login redirect.

import LoginForm from "@/components/LoginForm";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export const metadata = {
  title: "Sign In — Prompt AI Agents",
  description: "Sign in to Prompt AI Agents. No password needed.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/";

  return (
    <>
      <Nav />
      <main className="login-page">
        <LoginForm redirectTo={redirectTo} />
      </main>
      <Footer />
    </>
  );
}
