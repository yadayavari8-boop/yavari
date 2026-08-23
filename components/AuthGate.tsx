"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";

export default function AuthGate({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-sm text-center py-20 px-4">
      <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 grid place-items-center mx-auto mb-4">
        <LockKeyhole className="w-6 h-6" strokeWidth={2} />
      </div>
      <h2 className="font-extrabold text-ink mb-1.5">{title}</h2>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">{description}</p>
      <Link
        href={`/login?returnTo=${encodeURIComponent(pathname)}`}
        className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 transition-colors text-white font-bold rounded-full px-6 py-3 text-sm"
      >
        <LogIn className="w-4 h-4" strokeWidth={2.5} />
        چوونەژوورەوە / خۆتۆمارکردن
      </Link>
    </div>
  );
}
