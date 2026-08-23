import { ShieldAlert } from "lucide-react";

export default function SafetyBox() {
  return (
    <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-xs leading-relaxed text-amber-900">
        <p className="font-bold mb-1">ئاگاداری بۆ مامەڵەی سەلامەت</p>
        <ul className="list-disc pr-4 space-y-1">
          <li>لە شوێنی گشتی و ڕووناک یەکتری ببینن.</li>
          <li>پێش دانی پارە کاڵاکە بە باشی بپشکنە.</li>
          <li>پارە پێش بینینی کاڵا مەدە، تەنها لە کاتی وەرگرتن پارە بدە.</li>
          <li>بازاڕ هیچ بەرپرسیارێتیەکی مامەڵەکان لەسەر خۆی ناگرێت.</li>
        </ul>
      </div>
    </div>
  );
}
