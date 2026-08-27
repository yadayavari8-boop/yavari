"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

const AUTH_KEY = "bazaar:auth-user";

export interface AuthUser {
  id: string;
  name: string;
  phone: string; // E.164, e.g. +9647501234567
  city: string;
  created_at: string;
}

interface AuthStore {
  user: AuthUser | null;
  hydrated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthStore | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore corrupt/unavailable storage
    }
    setHydrated(true);
  }, []);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
    try {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    } catch {
      // session still works in-memory for this tab
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, hydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return trimmed;
  return `+964${trimmed.replace(/^0/, "")}`;
}
