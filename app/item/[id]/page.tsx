"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MessageCircle, MapPin, Clock, Tag, LogIn } from "lucide-react";
import Header from "@/components/Header";
import ImageGallery from "@/components/ImageGallery";
import SafetyBox from "@/components/SafetyBox";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { CATEGORIES } from "@/lib/mockData";
import { timeAgoCkb } from "@/lib/format";
import ItemPrice from "./ItemPrice";

export default function ItemDetailsPage({ params }: { params: { id: string } }) {
  const { getListingById, hydrated } = useAppStore();
  const { user, hydrated: authHydrated } = useAuth();
  const pathname = usePathname();
  const listing = getListingById(params.id);

  if (!hydrated || !authHydrated) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-10 text-center text-gray-400 text-sm">
          بارکردن...
        </div>
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="font-bold text-ink">ئەم ڕیکلامە نەدۆزرایەوە</p>
          <p className="text-sm text-gray-500 mt-1">لەوانەیە سڕدرابێت یان فرۆشرابێت</p>
        </div>
      </>
    );
  }

  const category = CATEGORIES.find((c) => c.slug === listing.category);
  const whatsappText = encodeURIComponent(
    `سڵاو، سەبارەت بەم ڕیکلامە پرسیارم هەیە: "${listing.title_ckb}"`
  );
  const whatsappHref = `https://wa.me/${listing.seller_phone.replace("+", "")}?text=${whatsappText}`;
  const telHref = `tel:${listing.seller_phone}`;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl sm:py-6 pb-28">
        <ImageGallery images={listing.images} alt={listing.title_ckb} />

        <div className="px-4 sm:px-0 mt-5 space-y-5">
          <div>
            <ItemPrice priceIqd={listing.price_iqd} priceUsd={listing.price_usd} />
            <h1 className="text-lg font-bold text-ink mt-1">{listing.title_ckb}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {listing.city}
                {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {timeAgoCkb(listing.created_at)}
              </span>
              {category && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  {category.name_ckb}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <span className="text-xs font-semibold bg-gray-100 text-ink rounded-full px-3 py-1.5">
              دۆخ: {listing.condition === "new" ? "نوێ" : "بەکارهاتوو"}
            </span>
            {listing.is_sold && (
              <span className="text-xs font-semibold bg-red-100 text-red-700 rounded-full px-3 py-1.5">
                فرۆشرا
              </span>
            )}
          </div>

          {listing.description_ckb && (
            <div>
              <h2 className="text-sm font-bold text-ink mb-1.5">وردەکاری</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {listing.description_ckb}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3.5">
            <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">
              {listing.seller_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-ink">{listing.seller_name}</p>
              <p className="text-xs text-gray-500">فرۆشیار</p>
            </div>
          </div>

          <SafetyBox />
        </div>
      </main>

      {!listing.is_sold && (
        <div className="fixed bottom-16 md:bottom-0 inset-x-0 z-20 bg-white border-t border-gray-100 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            {user ? (
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={telHref}
                  className="flex items-center justify-center gap-2 border-2 border-brand-500 text-brand-600 font-bold rounded-full py-3 text-sm hover:bg-brand-50 transition-colors"
                >
                  <Phone className="w-4 h-4" strokeWidth={2.5} />
                  پەیوەندی
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold rounded-full py-3 text-sm hover:brightness-95 transition-[filter]"
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
                  واتساپ
                </a>
              </div>
            ) : (
              <Link
                href={`/login?returnTo=${encodeURIComponent(pathname)}`}
                className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 transition-colors text-white font-bold rounded-full py-3 text-sm"
              >
                <LogIn className="w-4 h-4" strokeWidth={2.5} />
                چوونەژوورەوە بۆ پەیوەندیکردن بە فرۆشیار
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
