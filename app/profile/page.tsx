"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, CheckCircle2, Phone, LogOut, ShieldCheck, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";
import SmartImage from "@/components/SmartImage";
import { useAppStore, formatPrice } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { extractMessage } from "@/lib/errors";
import { Listing } from "@/lib/types";

export default function ProfilePage() {
  const { listings, currency, updateListing, deleteListing, hydrated } = useAppStore();
  const { user, hydrated: authHydrated, logout } = useAuth();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const mine = useMemo(
    () =>
      user
        ? listings
            .filter((l) => l.seller_id === user.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [],
    [listings, user]
  );

  if (!authHydrated) {
    return (
      <>
        <Header />
        <div className="text-center text-sm text-gray-400 py-20">بارکردن...</div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <AuthGate
          title="پرۆفایلەکەت ببینە"
          description="بۆ بینینی ڕیکلامەکانت و بەڕێوەبردنیان، پێویستە بچیتە ژوورەوە."
        />
      </>
    );
  }

  const active = mine.filter((l) => !l.is_sold);
  const sold = mine.filter((l) => l.is_sold);

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
    if (!window.confirm("دڵنیایت لە سڕینەوەی ئەم ڕیکلامە؟")) return;
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
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        <div className="flex items-center gap-4 bg-white rounded-2xl shadow-card p-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xl font-extrabold shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-ink truncate flex items-center gap-1.5">
              {user.name}
              {user.isAdmin && (
                <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-[10px] font-bold rounded-full px-2 py-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  ئەدمین
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5" dir="ltr">
              <Phone className="w-3 h-3" /> {user.phone}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{user.city}</p>
          </div>
          <button
            onClick={logout}
            className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            چوونەدەرەوە
          </button>
        </div>

        {user.isAdmin && (
          <Link
            href="/admin"
            className="mb-6 flex items-center justify-between bg-ink text-white rounded-2xl px-4 py-3.5"
          >
            <span className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              دەشبۆردی ئەدمین
            </span>
            <span className="text-xs text-gray-300">هەموو ڕیکلامەکان بەڕێوەببە</span>
          </Link>
        )}

        <StatRow activeCount={active.length} soldCount={sold.length} />

        {actionError && (
          <p className="text-sm text-red-600 font-medium text-center mb-4">{actionError}</p>
        )}

        {!hydrated ? (
          <p className="text-center text-sm text-gray-400 py-10">بارکردن...</p>
        ) : (
          <>
            <Section title={`ڕیکلامە چالاکەکان (${active.length})`}>
              {active.length === 0 && <EmptyState text="هیچ ڕیکلامێکی چالاکت نییە" />}
              {active.map((l) => (
                <DashboardRow
                  key={l.id}
                  listing={l}
                  currency={currency}
                  pending={pendingId === l.id}
                  onToggleSold={toggleSold}
                  onDelete={remove}
                />
              ))}
            </Section>

            {sold.length > 0 && (
              <Section title={`فرۆشراوەکان (${sold.length})`}>
                {sold.map((l) => (
                  <DashboardRow
                    key={l.id}
                    listing={l}
                    currency={currency}
                    pending={pendingId === l.id}
                    onToggleSold={toggleSold}
                    onDelete={remove}
                  />
                ))}
              </Section>
            )}
          </>
        )}
      </main>
    </>
  );
}

function StatRow({ activeCount, soldCount }: { activeCount: number; soldCount: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-white rounded-2xl shadow-card p-4 text-center">
        <p className="text-2xl font-extrabold text-brand-600">{activeCount}</p>
        <p className="text-xs text-gray-500 mt-0.5">ڕیکلامی چالاک</p>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-4 text-center">
        <p className="text-2xl font-extrabold text-ink">{soldCount}</p>
        <p className="text-xs text-gray-500 mt-0.5">فرۆشراو</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-ink mb-3">{title}</h2>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function DashboardRow({
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
        <button
          aria-label="دەستکاریکردن"
          disabled={pending}
          className="w-9 h-9 grid place-items-center rounded-full bg-gray-100 text-gray-600 disabled:opacity-50"
        >
          <Pencil className="w-4 h-4" />
        </button>
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 bg-white rounded-2xl shadow-card">
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
