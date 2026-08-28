"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { idbGet, idbSet } from "./idbStore";
import { isSupabaseConfigured, fetchUserByPhone, insertUserRow } from "./supabase";
import { extractMessage } from "./errors";

const AUTH_KEY = "bazaar:auth-user";
const ACCOUNTS_KEY = "bazaar:accounts"; // local-mode account registry, keyed by phone

/** The one phone number treated as an admin — can edit/delete any listing. */
export const ADMIN_PHONE = "+9647508415385";

export interface AuthUser {
  id: string;
  name: string;
  phone: string; // E.164, e.g. +9647501234567
  city: string;
  created_at: string;
  isAdmin: boolean;
}

interface AuthStore {
  user: AuthUser | null;
  hydrated: boolean;
  /** Always creates a brand-new account, even if the phone was used before. */
  signUp: (input: { name: string; phone: string; city: string }) => Promise<AuthUser>;
  /** Signs into the most recently created account matching this phone. Throws if none exists. */
  signIn: (phone: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthStore | null>(null);

export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return trimmed;
  return `+964${trimmed.replace(/^0/, "")}`;
}

function isAdminPhone(phone: string): boolean {
  return normalizePhone(phone) === normalizePhone(ADMIN_PHONE);
}

async function findAccountLocal(phone: string): Promise<AuthUser | null> {
  const accounts = (await idbGet<Record<string, AuthUser>>(ACCOUNTS_KEY)) ?? {};
  return accounts[phone] ?? null;
}

async function saveAccountLocal(user: AuthUser): Promise<void> {
  const accounts = (await idbGet<Record<string, AuthUser>>(ACCOUNTS_KEY)) ?? {};
  accounts[user.phone] = user;
  await idbSet(ACCOUNTS_KEY, accounts);
}

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

  const persistSession = useCallback((u: AuthUser) => {
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

  const signUp = useCallback(
    async ({ name, phone, city }: { name: string; phone: string; city: string }) => {
      const normalizedPhone = normalizePhone(phone);
      let account: AuthUser;

      if (isSupabaseConfigured) {
        // Intentionally no duplicate-phone check — signing up always
        // creates a new account, even for a phone already registered.
        const { data, error } = await insertUserRow({
          full_name: name.trim(),
          phone: normalizedPhone,
          city,
        });
        if (error || !data) {
          throw new Error(extractMessage(error) || "sign up failed");
        }
        account = {
          id: data.id,
          name: data.full_name,
          phone: data.phone,
          city: data.city,
          created_at: data.created_at,
          isAdmin: isAdminPhone(data.phone),
        };
      } else {
        account = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: name.trim(),
          phone: normalizedPhone,
          city,
          created_at: new Date().toISOString(),
          isAdmin: isAdminPhone(normalizedPhone),
        };
        await saveAccountLocal(account);
      }

      persistSession(account);
      return account;
    },
    [persistSession]
  );

  const signIn = useCallback(
    async (phone: string) => {
      const normalizedPhone = normalizePhone(phone);
      let account: AuthUser | null;

      if (isSupabaseConfigured) {
        const { data, error } = await fetchUserByPhone(normalizedPhone);
        if (error) throw new Error(extractMessage(error) || "sign in failed");
        account = data
          ? {
              id: data.id,
              name: data.full_name,
              phone: data.phone,
              city: data.city,
              created_at: data.created_at,
              isAdmin: isAdminPhone(data.phone),
            }
          : null;
      } else {
        account = await findAccountLocal(normalizedPhone);
      }

      if (!account) {
        throw new Error("NOT_FOUND");
      }

      persistSession(account);
      return account;
    },
    [persistSession]
  );

  return (
    <AuthContext.Provider value={{ user, hydrated, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
