"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Currency, Listing } from "./types";
import { MOCK_LISTINGS } from "./mockData";
import { idbGet, idbSet } from "./idbStore";
import {
  isSupabaseConfigured,
  supabase,
  fetchListings as fetchListingsRemote,
  insertListing,
  updateListingRow,
  deleteListingRow,
} from "./supabase";

const LISTINGS_KEY = "bazaar:listings";
const CURRENCY_KEY = "bazaar:currency";
const CITY_KEY = "bazaar:city";

export const ALL_CITIES_LABEL = "هەموو شارەکان";

/** "cloud": shared Supabase backend, visible on every device.
 *  "local": per-device IndexedDB only — the app's fallback when no
 *  Supabase project is connected yet (see lib/supabase.ts). */
export type SyncMode = "cloud" | "local";

function mergeWithMock(stored: Listing[]): Listing[] {
  const byId = new Map(MOCK_LISTINGS.map((l) => [l.id, l]));
  for (const l of stored) byId.set(l.id, l);
  return Array.from(byId.values());
}

/**
 * Local-only fallback storage. Listings (with photos) live in IndexedDB,
 * not localStorage — localStorage caps out around 5-10MB per site, which
 * even a couple of uncompressed phone photos can exceed.
 */
async function loadLocalListings(): Promise<Listing[]> {
  try {
    const stored = await idbGet<Listing[]>(LISTINGS_KEY);
    if (stored) return mergeWithMock(stored);
  } catch {
    // fall through to legacy localStorage migration below
  }
  try {
    const raw = window.localStorage.getItem(LISTINGS_KEY);
    if (raw) {
      const legacy: Listing[] = JSON.parse(raw);
      await idbSet(LISTINGS_KEY, legacy).catch(() => {});
      window.localStorage.removeItem(LISTINGS_KEY);
      return mergeWithMock(legacy);
    }
  } catch {
    // ignore corrupt/unavailable legacy data
  }
  return MOCK_LISTINGS;
}

type NewListingInput = Omit<Listing, "id" | "created_at">;

interface AppStore {
  hydrated: boolean;
  syncMode: SyncMode;
  // filters
  city: string;
  setCity: (c: string) => void;
  currency: Currency;
  toggleCurrency: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // listings
  listings: Listing[];
  /** Resolves with the saved listing (including its final id) once confirmed. */
  addListing: (listing: NewListingInput) => Promise<Listing>;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  getListingById: (id: string) => Listing | undefined;
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<string>(ALL_CITIES_LABEL);
  const [currency, setCurrency] = useState<Currency>("IQD");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [hydrated, setHydrated] = useState(false);
  const syncMode: SyncMode = isSupabaseConfigured ? "cloud" : "local";

  const listingsRef = useRef<Listing[]>(listings);
  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  // Initial load + (cloud mode) live subscription so listings posted on
  // another device show up here without a manual refresh.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await fetchListingsRemote();
        if (!cancelled && !error && data) setListings(data as Listing[]);
      } else {
        const loaded = await loadLocalListings();
        if (!cancelled) setListings(loaded);
      }

      try {
        const savedCurrency = window.localStorage.getItem(CURRENCY_KEY) as Currency | null;
        const savedCity = window.localStorage.getItem(CITY_KEY);
        if (savedCurrency === "IQD" || savedCurrency === "USD") setCurrency(savedCurrency);
        if (savedCity) setCityState(savedCity);
      } catch {
        // non-critical
      }

      if (!cancelled) setHydrated(true);
    })();

    if (!isSupabaseConfigured) {
      return () => {
        cancelled = true;
      };
    }

    const channel = supabase
      .channel("listings-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        (payload) => {
          setListings((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Listing;
              if (prev.some((l) => l.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Listing;
              return prev.map((l) => (l.id === row.id ? row : l));
            }
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old as { id: string };
              return prev.filter((l) => l.id !== oldRow.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        window.localStorage.setItem(CURRENCY_KEY, currency);
      } catch {
        // non-critical
      }
    }
  }, [currency, hydrated]);

  useEffect(() => {
    if (hydrated) {
      try {
        window.localStorage.setItem(CITY_KEY, city);
      } catch {
        // non-critical
      }
    }
  }, [city, hydrated]);

  const setCity = useCallback((c: string) => setCityState(c), []);
  const toggleCurrency = useCallback(
    () => setCurrency((c) => (c === "IQD" ? "USD" : "IQD")),
    []
  );

  const addListing = useCallback(async (input: NewListingInput): Promise<Listing> => {
    if (isSupabaseConfigured) {
      const { data, error } = await insertListing(input);
      if (error || !data) throw error ?? new Error("insert failed");
      const saved = data as Listing;
      // The realtime subscription above will also deliver this INSERT; the
      // de-dupe check there keeps this from double-adding it.
      setListings((prev) => [saved, ...prev]);
      return saved;
    }

    const saved: Listing = {
      ...input,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    };
    const next = [saved, ...listingsRef.current];
    setListings(next);
    await idbSet(LISTINGS_KEY, next);
    return saved;
  }, []);

  const updateListing = useCallback((id: string, patch: Partial<Listing>) => {
    const next = listingsRef.current.map((l) => (l.id === id ? { ...l, ...patch } : l));
    setListings(next);
    if (isSupabaseConfigured) {
      updateListingRow(id, patch).catch(() => {});
    } else {
      idbSet(LISTINGS_KEY, next).catch(() => {});
    }
  }, []);

  const deleteListing = useCallback((id: string) => {
    const next = listingsRef.current.filter((l) => l.id !== id);
    setListings(next);
    if (isSupabaseConfigured) {
      deleteListingRow(id).catch(() => {});
    } else {
      idbSet(LISTINGS_KEY, next).catch(() => {});
    }
  }, []);

  const getListingById = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings]
  );

  return (
    <AppContext.Provider
      value={{
        hydrated,
        syncMode,
        city,
        setCity,
        currency,
        toggleCurrency,
        searchQuery,
        setSearchQuery,
        listings,
        addListing,
        updateListing,
        deleteListing,
        getListingById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}

export function formatPrice(priceIqd: number, priceUsd: number, currency: Currency) {
  if (currency === "USD") return `$${priceUsd.toLocaleString("en-US")}`;
  return `${priceIqd.toLocaleString("en-US")} د.ع`;
}
