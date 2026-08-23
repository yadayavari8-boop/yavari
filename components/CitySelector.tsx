"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { CITIES } from "@/lib/mockData";
import { useAppStore, ALL_CITIES_LABEL } from "@/lib/store";

export default function CitySelector() {
  const { city, setCity } = useAppStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1 text-sm font-medium text-ink bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-2.5 transition-colors"
      >
        <MapPin className="w-4 h-4 text-brand-500" />
        <span className="hidden sm:inline max-w-[6rem] truncate">{city}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-cardHover border border-gray-100 py-1.5 z-40"
        >
          {[ALL_CITIES_LABEL, ...CITIES].map((c) => (
            <li key={c}>
              <button
                onClick={() => {
                  setCity(c);
                  setOpen(false);
                }}
                className={`w-full text-right px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors ${
                  city === c ? "text-brand-600 font-semibold" : "text-ink"
                }`}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
