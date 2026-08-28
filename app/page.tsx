"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Header from "@/components/Header";
import SyncModeBanner from "@/components/SyncModeBanner";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import FilterSheet, { SortOption } from "@/components/FilterSheet";
import { useAppStore, ALL_CITIES_LABEL } from "@/lib/store";
import { CategorySlug, Condition } from "@/lib/types";
import { SlidersHorizontal, PlusCircle, PackageSearch } from "lucide-react";

export default function HomePage() {
  const { listings, city, searchQuery } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<CategorySlug | null>(null);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = (condition ? 1 : 0) + (sort !== "newest" ? 1 : 0);

  const results = useMemo(() => {
    // Sold listings stay visible (never disappear) — clicking one is
    // intercepted by ProductCard instead, which shows a "sold out" popup.
    let filtered = listings;

    if (city !== ALL_CITIES_LABEL) {
      filtered = filtered.filter((l) => l.city === city);
    }
    if (activeCategory) {
      filtered = filtered.filter((l) => l.category === activeCategory);
    }
    if (condition) {
      filtered = filtered.filter((l) => l.condition === condition);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title_ckb.toLowerCase().includes(q) ||
          l.description_ckb.toLowerCase().includes(q)
      );
    }

    const sorted = [...filtered];
    switch (sort) {
      case "price_asc":
        sorted.sort((a, b) => a.price_iqd - b.price_iqd);
        break;
      case "price_desc":
        sorted.sort((a, b) => b.price_iqd - a.price_iqd);
        break;
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Sink sold listings to the bottom, without disturbing the relative
    // order within each group — still visible and searchable, just not
    // competing with active listings for the top of the feed.
    sorted.sort((a, b) => Number(a.is_sold) - Number(b.is_sold));

    return sorted;
  }, [listings, city, activeCategory, condition, sort, searchQuery]);

  return (
    <>
      <Header />
      <SyncModeBanner />
      <main className="mx-auto max-w-6xl">
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />

        <div className="flex items-center justify-between px-4 pb-2">
          <h1 className="text-sm font-bold text-ink">
            {results.length} ڕیکلام دۆزرایەوە
            {city !== ALL_CITIES_LABEL && <span className="text-gray-400 font-normal"> · {city}</span>}
          </h1>
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            فلتەر
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 grid place-items-center bg-brand-500 text-white rounded-full text-[10px]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4 pb-24">
          {results.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>

        {results.length === 0 && listings.length === 0 && (
          <div className="text-center py-24 px-4">
            <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 grid place-items-center mx-auto mb-4">
              <PackageSearch className="w-6 h-6" strokeWidth={2} />
            </div>
            <p className="font-bold text-ink">هێشتا هیچ ڕیکلامێک نییە</p>
            <p className="text-sm text-gray-500 mt-1 mb-5">یەکەم کەس بە کە ڕیکلامێک دادەنێت</p>
            <Link
              href="/post"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 transition-colors text-white font-bold rounded-full px-6 py-3 text-sm"
            >
              <PlusCircle className="w-4 h-4" strokeWidth={2.5} />
              ڕیکلامی خۆت دابنێ
            </Link>
          </div>
        )}

        {results.length === 0 && listings.length > 0 && (
          <div className="text-center py-24 text-gray-400 px-4">
            <p className="font-semibold">هیچ ڕیکلامێک نەدۆزرایەوە</p>
            <p className="text-sm mt-1">تاقی بکەرەوە بە هەڵبژاردنێکی تر یان شارێکی تر</p>
          </div>
        )}
      </main>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        condition={condition}
        onConditionChange={setCondition}
        sort={sort}
        onSortChange={setSort}
      />
    </>
  );
}
