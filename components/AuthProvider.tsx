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

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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
