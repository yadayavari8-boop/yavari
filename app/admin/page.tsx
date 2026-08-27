"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, CheckCircle2, ShieldCheck, Loader2, Phone } from "lucide-react";
import Header from "@/components/Header";
import SmartImage from "@/components/SmartImage";
import { useAppStore, formatPrice } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { extractMessage } from "@/lib/errors";
import { timeAgoCkb } from "@/lib/format";
import { Listing } from "@/lib/types";

export default function AdminPage() {
  const { listings, currency, updateListing, deleteListing, hydrated } = useAppStore();
  const { user, hydrated: authHydrated } = useAuth();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const sorted = [...listings].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (!query.trim()) return sorted;
    const q = query.trim().toLowerCase();
    return sorted.filter(
      (l) =>
        l.title_ckb.toLowerCase().includes(q) ||
        l.seller_name.toLowerCase().includes(q) ||
        l.seller_phone.includes(q)
    );
  }, [listings, query]);

  if (!authHydrated) {
    return (
      <>
        <Header />
        <div className="text-center text-sm text-gray-400 py-20">بارکردن...</div>
      </>
    );
  }

  if (!user?.isAdmin) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-sm text-center py-20 px-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 grid place-items-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-ink mb-1.5">دەسەڵاتت نییە</h2>
          <p className="text-sm text-gray-500">ئەم پەڕەیە تەنها بۆ ئەدمینەکانە.</p>
        </div>
      </>
    );
  }

  async function toggleSold(id: string, current: boolean) {
    setActionError("");
    setPendingId(id);
    try {
      await updateListing(id, { is_sold: !current });
    } catch (err) {
      setActionError(extractMessage(err) || "نوێکردنەوە سەرکەوتوو نەبوو");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("دڵنیایت لە سڕینەوەی ئەم ڕیکلامە؟ ئەمە کردارێکی ئەدمینە.")) return;
    setActionError("");
    setPendingId(id);
    try {
      await deleteListing(id);
    } catch (err) {
      setActionError(extractMessage(err) || "سڕینەوە سەرکەوتوو نەبوو");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-extrabold text-ink">دەشبۆردی ئەدمین</h1>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          هەموو ڕیکلامەکانی هەموو بەکارهێنەران ({listings.length})
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="گەڕان بەپێی ناونیشان، ناوی فرۆشیار یان ژمارە..."
          className="w-full bg-gray-50 border border-gray-200 focus:border-brand-500 rounded-xl px-3.5 py-3 text-sm outline-none placeholder:text-gray-400 mb-4"
        />

        {actionError && (
          <p className="text-sm text-red-600 font-medium text-center mb-4">{actionError}</p>
        )}

        {!hydrated ? (
          <p className="text-center text-sm text-gray-400 py-10">بارکردن...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-card">
            <p className="text-sm text-gray-400">هیچ ڕیکلامێک نەدۆزرایەوە</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((l) => (
              <AdminRow
                key={l.id}
                listing={l}
                currency={currency}
                pending={pendingId === l.id}
                onToggleSold={toggleSold}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function AdminRow({
  listing,
  currency,
  pending,
  onToggleSold,
  onDelete,
}: {
  listing: Listing;
  currency: "IQD" | "USD";
  pending: boolean;
  onToggleSold: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-2.5">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
        <SmartImage src={listing.images[0]} alt={listing.title_ckb} fill sizes="64px" className="object-cover" />
        {listing.is_sold && (
          <span className="absolute inset-0 bg-black/50 grid place-items-center text-white text-[10px] font-bold">
            فرۆشرا
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink truncate">{listing.title_ckb}</p>
        <p className="text-sm font-extrabold text-brand-600 mt-0.5">
          {formatPrice(listing.price_iqd, listing.price_usd, currency)}
        </p>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
          <span className="truncate">{listing.seller_name}</span>
          <span className="flex items-center gap-0.5 shrink-0" dir="ltr">
            <Phone className="w-3 h-3" />
            {listing.seller_phone}
          </span>
          <span className="shrink-0">{timeAgoCkb(listing.created_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggleSold(listing.id, listing.is_sold)}
          disabled={pending}
          aria-label={listing.is_sold ? "گەڕاندنەوە بۆ چالاک" : "نیشانکردن وەک فرۆشراو"}
          className={`w-9 h-9 grid place-items-center rounded-full transition-colors disabled:opacity-50 ${
            listing.is_sold ? "bg-gray-100 text-gray-500" : "bg-brand-50 text-brand-600"
          }`}
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        </button>
        <Link
          href={`/admin/edit/${listing.id}`}
          aria-label="دەستکاریکردن"
          className="w-9 h-9 grid place-items-center rounded-full bg-gray-100 text-gray-600"
        >
          <Pencil className="w-4 h-4" />
        </Link>
        <button
          onClick={() => onDelete(listing.id)}
          disabled={pending}
          aria-label="سڕینەوە"
          className="w-9 h-9 grid place-items-center rounded-full bg-red-50 text-red-600 disabled:opacity-50"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
