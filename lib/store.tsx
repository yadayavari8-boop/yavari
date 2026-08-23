"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Currency, Listing } from "./types";
import { MOCK_LISTINGS } from "./mockData";

const LISTINGS_KEY = "bazaar:listings";
const CURRENCY_KEY = "bazaar:currency";
const CITY_KEY = "bazaar:city";

export const ALL_CITIES_LABEL = "هەموو شارەکان";

function loadListings(): Listing[] {
  if (typeof window === "undefined") return MOCK_LISTINGS;
  try {
    const raw = window.localStorage.getItem(LISTINGS_KEY);
    if (!raw) return MOCK_LISTINGS;
    const stored: Listing[] = JSON.parse(raw);
    // Merge: stored listings (includes edits/new posts) win over seed data by id
    const byId = new Map(MOCK_LISTINGS.map((l) => [l.id, l]));
    for (const l of stored) byId.set(l.id, l);
    return Array.from(byId.values());
  } catch {
    return MOCK_LISTINGS;
  }
}

function persistListings(listings: Listing[]) {
  try {
    window.localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently,
    // the session still works in-memory for this tab.
  }
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
  addListing: (listing: Listing) => void;
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

  // Hydrate from localStorage on mount (client only, avoids SSR mismatch)
  useEffect(() => {
    setListings(loadListings());
    const savedCurrency = window.localStorage.getItem(CURRENCY_KEY) as Currency | null;
    const savedCity = window.localStorage.getItem(CITY_KEY);
    if (savedCurrency === "IQD" || savedCurrency === "USD") setCurrency(savedCurrency);
    if (savedCity) setCityState(savedCity);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persistListings(listings);
  }, [listings, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CURRENCY_KEY, currency);
  }, [currency, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CITY_KEY, city);
  }, [city, hydrated]);

  const setCity = useCallback((c: string) => setCityState(c), []);
  const toggleCurrency = useCallback(
    () => setCurrency((c) => (c === "IQD" ? "USD" : "IQD")),
    []
  );

  const addListing = useCallback((listing: Listing) => {
    setListings((prev) => [listing, ...prev]);
  }, []);

  const updateListing = useCallback((id: string, patch: Partial<Listing>) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const deleteListing = useCallback((id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
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
