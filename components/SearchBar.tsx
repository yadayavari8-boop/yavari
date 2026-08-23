"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pathname !== "/") router.push("/");
  }

  function handleChange(value: string) {
    setSearchQuery(value);
    if (value && pathname !== "/") router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="گەڕان بۆ کاڵا، وەک: ئۆتۆمبێل، مۆبایل..."
        className="w-full bg-gray-100 focus:bg-white border border-transparent focus:border-brand-500 rounded-full pr-10 pl-9 py-2.5 text-sm placeholder:text-gray-400 outline-none transition-colors"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          aria-label="پاککردنەوەی گەڕان"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  );
}
