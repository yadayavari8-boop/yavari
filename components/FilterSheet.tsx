"use client";

import { X } from "lucide-react";
import { Condition } from "@/lib/types";

export type SortOption = "newest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "نوێترین" },
  { value: "price_asc", label: "نرخ: لە کەمەوە بۆ زۆر" },
  { value: "price_desc", label: "نرخ: لە زۆرەوە بۆ کەم" },
];

export default function FilterSheet({
  open,
  onClose,
  condition,
  onConditionChange,
  sort,
  onSortChange,
}: {
  open: boolean;
  onClose: () => void;
  condition: Condition | null;
  onConditionChange: (c: Condition | null) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 pb-8 sm:pb-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-ink">فلتەرکردن</h2>
          <button onClick={onClose} aria-label="داخستن" className="w-8 h-8 grid place-items-center rounded-full bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-ink mb-2.5">دۆخی کاڵا</h3>
          <div className="grid grid-cols-3 gap-2">
            {(["", "new", "used"] as const).map((c) => (
              <button
                key={c || "any"}
                onClick={() => onConditionChange(c === "" ? null : (c as Condition))}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                  (condition ?? "") === c
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "bg-white border-gray-200 text-ink"
                }`}
              >
                {c === "" ? "هەمووی" : c === "new" ? "نوێ" : "بەکارهاتوو"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-ink mb-2.5">ڕیزکردن بەپێی</h3>
          <div className="space-y-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={`w-full text-right rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  sort === opt.value
                    ? "bg-brand-50 border-brand-500 text-brand-700"
                    : "bg-white border-gray-200 text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              onConditionChange(null);
              onSortChange("newest");
            }}
            className="rounded-full border border-gray-200 py-3 text-sm font-bold text-ink"
          >
            سڕینەوەی فلتەر
          </button>
          <button
            onClick={onClose}
            className="rounded-full bg-brand-500 text-white py-3 text-sm font-bold"
          >
            پیشاندان
          </button>
        </div>
      </div>
    </div>
  );
}
