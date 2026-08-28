"use client";

import Link from "next/link";
import { Plus, LogIn, ShieldCheck } from "lucide-react";
import SearchBar from "./SearchBar";
import CitySelector from "./CitySelector";
import CurrencyToggle from "./CurrencyToggle";
import { useAuth } from "@/lib/auth";

export default function Header() {
  const { user, hydrated } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-500 text-white font-extrabold text-lg">
            ب
          </span>
          <span className="hidden sm:block font-extrabold text-lg tracking-tight text-ink">
            بازاڕ
          </span>
        </Link>

        <div className="flex-1 min-w-0">
          <SearchBar />
        </div>

        <CitySelector />
        <CurrencyToggle />

        {hydrated && user?.isAdmin && (
          <Link
            href="/admin"
            aria-label="دەشبۆردی ئەدمین"
            className="hidden sm:flex items-center gap-1 text-xs font-bold bg-ink text-white rounded-full px-3 py-2 shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            ئەدمین
          </Link>
        )}

        {hydrated && user ? (
          <Link
            href="/profile"
            aria-label="پرۆفایل"
            className="hidden sm:grid place-items-center w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-extrabold text-sm shrink-0"
          >
            {user.name.charAt(0)}
          </Link>
        ) : (
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-600 shrink-0"
          >
            <LogIn className="w-4 h-4" strokeWidth={2.5} />
            چوونەژوورەوە
          </Link>
        )}

        <Link
          href="/post"
          className="hidden md:flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 transition-colors text-white font-semibold rounded-full pl-4 pr-3.5 py-2.5 shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          ڕیکلام دابنێ
        </Link>
      </div>
      <div className="flag-stripe" />
    </header>
  );
}
