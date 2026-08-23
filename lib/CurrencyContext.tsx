"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Currency } from "./types";

interface CurrencyContextValue {
  currency: Currency;
  toggle: () => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "IQD",
  toggle: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("IQD");
  const toggle = () => setCurrency((c) => (c === "IQD" ? "USD" : "IQD"));
  return (
    <CurrencyContext.Provider value={{ currency, toggle }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function formatPrice(priceIqd: number, priceUsd: number, currency: Currency) {
  if (currency === "USD") {
    return `$${priceUsd.toLocaleString("en-US")}`;
  }
  return `${priceIqd.toLocaleString("en-US")} د.ع`;
}
