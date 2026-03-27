"use client";

// ─── AuthProvider ────────────────────────────────────────────────────────────
//
// React context that provides user auth state to all client components.
// Calls /api/auth/me on mount to check for an existing session cookie.
// Used by: NavClient (show Sign In vs. name), tool components (skip email gate).

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  jobTitle?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** Re-fetch user from /api/auth/me (call after login). */
  refresh: () => Promise<void>;
  /** Clear local user state + call /api/auth/logout. */
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

/** Read the paa_name cookie synchronously (client-only, non-httpOnly). */
function getNameFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)paa_name=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  // Seed initial state from the client-readable cookie to prevent nav blink.
  // The full user object (id, email, jobTitle) loads async from /api/auth/me.
  const cachedName = getNameFromCookie();
  const [user, setUser] = useState<AuthUser | null>(
    cachedName
      ? { id: "", email: "", firstName: cachedName }
      : null
  );
  const [loading, setLoading] = useState(!cachedName);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors on logout
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
