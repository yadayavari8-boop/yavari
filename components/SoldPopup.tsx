"use client";

import { Ban } from "lucide-react";

export default function SoldPopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-xs bg-white rounded-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 grid place-items-center mx-auto mb-4">
          <Ban className="w-6 h-6" strokeWidth={2} />
        </div>
        <h2 className="font-extrabold text-ink mb-1.5">ئەم ڕیکلامە فرۆشراوە!</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          ئەم کاڵایە پێشتر فرۆشراوە و ئیتر ناتوانیت دەستت پێبگات یان پەیوەندی بە فرۆشیارەکەیەوە بکەیت.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-brand-500 hover:bg-brand-600 transition-colors text-white font-bold rounded-full py-3 text-sm"
        >
          باشە
        </button>
      </div>
    </div>
  );
}
