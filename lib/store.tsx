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

const LISTINGS_KEY = "bazaar:listings";
const CURRENCY_KEY = "bazaar:currency";
const CITY_KEY = "bazaar:city";

export const ALL_CITIES_LABEL = "هەموو شارەکان";

function mergeWithMock(stored: Listing[]): Listing[] {
  const byId = new Map(MOCK_LISTINGS.map((l) => [l.id, l]));
  for (const l of stored) byId.set(l.id, l);
  return Array.from(byId.values());
}

/**
 * Listings (including their photos) live in IndexedDB, not localStorage —
 * localStorage caps out around 5-10MB per site, which even one or two
 * uncompressed phone photos can exceed, causing posts to silently fail to
 * save. IndexedDB's quota is dramatically larger and fits this use case.
 */
async function loadListings(): Promise<Listing[]> {
  try {
    const stored = await idbGet<Listing[]>(LISTINGS_KEY);
    if (stored) return mergeWithMock(stored);
  } catch {
    // IndexedDB unavailable — fall through to the one-time migration below
  }

  // One-time migration for anyone who used an earlier build that stored
  // listings in localStorage — carry that data forward instead of losing it.
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

interface AppStore {
  hydrated: boolean;
  // filters
  city: string;
  setCity: (c: string) => void;
  currency: Currency;
  toggleCurrency: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // listings
  listings: Listing[];
  /** Resolves once the new listing is confirmed saved; rejects if it wasn't. */
  addListing: (listing: Listing) => Promise<void>;
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

  // Keep a ref in sync so add/update/delete can compute the *next* array
  // synchronously and persist that exact value, instead of racing React's
  // batched state updates.
  const listingsRef = useRef<Listing[]>(listings);
  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const loaded = await loadListings();
      if (!cancelled) setListings(loaded);

      try {
        const savedCurrency = window.localStorage.getItem(CURRENCY_KEY) as Currency | null;
        const savedCity = window.localStorage.getItem(CITY_KEY);
        if (savedCurrency === "IQD" || savedCurrency === "USD") setCurrency(savedCurrency);
        if (savedCity) setCityState(savedCity);
      } catch {
        // localStorage unavailable — filters just won't persist, non-critical
      }

      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
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

  const addListing = useCallback(async (listing: Listing) => {
    const next = [listing, ...listingsRef.current];
    setListings(next);
    // Persisted explicitly (not via a background effect) so the caller can
    // await confirmation and show an error instead of a false "success".
    await idbSet(LISTINGS_KEY, next);
  }, []);

  const updateListing = useCallback((id: string, patch: Partial<Listing>) => {
    const next = listingsRef.current.map((l) => (l.id === id ? { ...l, ...patch } : l));
    setListings(next);
    idbSet(LISTINGS_KEY, next).catch(() => {});
  }, []);

  const deleteListing = useCallback((id: string) => {
    const next = listingsRef.current.filter((l) => l.id !== id);
    setListings(next);
    idbSet(LISTINGS_KEY, next).catch(() => {});
  }, []);

  const getListingById = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings]
  );

  return (
    <AppContext.Provider
      value={{
        hydrated,
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
