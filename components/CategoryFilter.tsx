"use client";

import * as Icons from "lucide-react";
import { CATEGORIES } from "@/lib/mockData";
import { CategorySlug } from "@/lib/types";
import { LucideIcon } from "lucide-react";

export default function CategoryFilter({
  active,
  onChange,
}: {
  active: CategorySlug | null;
  onChange: (slug: CategorySlug | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      <Chip
        label="هەمووی"
        icon="LayoutGrid"
        active={active === null}
        onClick={() => onChange(null)}
      />
      {CATEGORIES.map((cat) => (
        <Chip
          key={cat.slug}
          label={cat.name_ckb}
          icon={cat.icon}
          active={active === cat.slug}
          onClick={() => onChange(cat.slug)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[icon] ?? Icons.Tag;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
        active
          ? "bg-brand-500 border-brand-500 text-white"
          : "bg-white border-gray-200 text-ink hover:border-brand-300"
      }`}
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
      {label}
    </button>
  );
}
