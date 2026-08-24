export type City = "هەولێر" | "سلێمانی" | "دهۆک" | "هەڵەبجە";

export type CategorySlug =
  | "cars"
  | "electronics"
  | "real-estate"
  | "home-goods"
  | "fashion"
  | "jobs"
  | "instruments"
  | "perfumes";

export interface Category {
  slug: CategorySlug;
  name_ckb: string; // Central Kurdish (Sorani) label
  name_en: string;
  icon: string; // lucide-react icon name
}

export type Currency = "IQD" | "USD";
export type Condition = "new" | "used";

export interface Listing {
  id: string;
  title_ckb: string;
  // Optional localized fields — nullable in the DB, not yet populated by
  // the current UI (which only writes Kurdish), but reserved so the app
  // can start filling them in later without another migration.
  title_ar?: string;
  title_en?: string;
  price_iqd: number;
  price_usd: number;
  currency_default: Currency;
  category: CategorySlug;
  city: City;
  neighborhood?: string;
  condition: Condition;
  description_ckb: string;
  description_ar?: string;
  description_en?: string;
  images: string[];
  is_featured: boolean;
  is_sold: boolean;
  seller_id: string;
  seller_name: string;
  seller_phone: string; // E.164, e.g. +9647501234567
  created_at: string; // ISO date
}

export interface SellerProfile {
  id: string;
  full_name: string;
  phone: string;
  city: City;
  avatar_url?: string;
  member_since: string;
  rating: number;
}
