"use client";

import Link from "next/link";
import SmartImage from "./SmartImage";
import { MapPin } from "lucide-react";
import { Listing } from "@/lib/types";
import { useAppStore, formatPrice } from "@/lib/store";
import { timeAgoCkb } from "@/lib/format";

export default function ProductCard({ listing }: { listing: Listing }) {
  const { currency } = useAppStore();

  return (
    <Link
      href={`/item/${listing.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-cardHover transition-shadow"
    >
      <div className="relative aspect-square bg-gray-100">
        <SmartImage
          src={listing.images[0]}
          alt={listing.title_ckb}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />
        {listing.is_sold && (
          <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-extrabold text-sm">
            فرۆشرا
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="font-extrabold text-brand-600 text-[15px] leading-none mb-1.5">
          {formatPrice(listing.price_iqd, listing.price_usd, currency)}
        </p>
        <h3 className="text-sm text-ink line-clamp-2 min-h-[2.5rem]">{listing.title_ckb}</h3>
        <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {listing.city}
          </span>
          <span className="shrink-0">{timeAgoCkb(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
