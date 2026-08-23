"use client";

import { useAppStore, formatPrice } from "@/lib/store";

export default function ItemPrice({
  priceIqd,
  priceUsd,
}: {
  priceIqd: number;
  priceUsd: number;
}) {
  const { currency } = useAppStore();
  return (
    <p className="text-2xl font-extrabold text-brand-600">
      {formatPrice(priceIqd, priceUsd, currency)}
    </p>
  );
}
