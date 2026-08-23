"use client";

import { useAppStore } from "@/lib/store";

export default function CurrencyToggle() {
  const { currency, toggleCurrency } = useAppStore();

  return (
    <button
      onClick={toggleCurrency}
      aria-label="گۆڕینی دراو"
      className="shrink-0 flex items-center bg-gray-100 rounded-full p-1 text-xs font-bold"
    >
      <span
        className={`px-2.5 py-1.5 rounded-full transition-colors ${
          currency === "IQD" ? "bg-brand-500 text-white" : "text-gray-500"
        }`}
      >
        IQD
      </span>
      <span
        className={`px-2.5 py-1.5 rounded-full transition-colors ${
          currency === "USD" ? "bg-brand-500 text-white" : "text-gray-500"
        }`}
      >
        USD
      </span>
    </button>
  );
}
