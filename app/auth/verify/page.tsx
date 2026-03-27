// ─── /auth/verify ────────────────────────────────────────────────────────────
//
// Legacy path. The actual verify logic now lives in /api/auth/verify (Route
// Handler) so it can set cookies. If someone hits this page directly, redirect
// them to the API route with their token, or show an error if no token.

import { redirect } from "next/navigation";

interface VerifyPageProps {
  searchParams: Promise<{ token?: string; redirect?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const token = params.token;
  const redirectTo = params.redirect || "/";

  if (token) {
    // Forward to the API route that can actually set cookies
    redirect(`/api/auth/verify?token=${token}&redirect=${encodeURIComponent(redirectTo)}`);
  }

  // No token: send to error page
  redirect("/auth/verify-error?message=no-token");
}
