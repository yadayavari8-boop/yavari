"use client";

import { useState } from "react";
import { CloudOff, X } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function SyncModeBanner() {
  const { syncMode, hydrated } = useAppStore();
  const [dismissed, setDismissed] = useState(false);

  if (!hydrated || syncMode === "cloud" || dismissed) return null;

  return (
    <div className="mx-4 mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-amber-800">
      <CloudOff className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
      <p className="flex-1 leading-relaxed">
        دۆخی ناوخۆیی: ڕیکلامەکان تەنها لەسەر ئەم ئامێرە پیشان دەدرێن، هێشتا لەگەڵ مۆبایل/کۆمپیوتەری تر هاوبەش نین.
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="داخستن"
        className="shrink-0 text-amber-600 hover:text-amber-800"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
