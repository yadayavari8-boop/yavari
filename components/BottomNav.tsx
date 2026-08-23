"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, MessageCircle, User } from "lucide-react";

const items = [
  { href: "/", label: "سەرەکی", icon: Home },
  { href: "/post", label: "ڕیکلام", icon: PlusCircle },
  { href: "/chats", label: "گفتوگۆ", icon: MessageCircle },
  { href: "/profile", label: "پرۆفایل", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 grid grid-cols-4">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 py-2"
          >
            <Icon
              className={`w-5 h-5 ${active ? "text-brand-500" : "text-gray-400"}`}
              strokeWidth={active ? 2.5 : 2}
            />
            <span className={`text-[10px] font-medium ${active ? "text-brand-600" : "text-gray-400"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
