import { Category, Listing } from "./types";

export const CATEGORIES: Category[] = [
  { slug: "cars", name_ckb: "ئۆتۆمبێل", name_en: "Cars", icon: "Car" },
  { slug: "electronics", name_ckb: "ئەلیکترۆنی", name_en: "Electronics", icon: "Smartphone" },
  { slug: "real-estate", name_ckb: "خانوبەرە", name_en: "Real Estate", icon: "Home" },
  { slug: "home-goods", name_ckb: "کەلوپەلی ماڵ", name_en: "Home Goods", icon: "Sofa" },
  { slug: "fashion", name_ckb: "جل و بەرگ", name_en: "Fashion", icon: "Shirt" },
  { slug: "jobs", name_ckb: "کارو بار", name_en: "Jobs", icon: "Briefcase" },
  { slug: "instruments", name_ckb: "ئامێری مۆسیقی", name_en: "Instruments", icon: "Music" },
  { slug: "perfumes", name_ckb: "عەتر و بۆن", name_en: "Perfumes", icon: "SprayCan" },
];

export const CITIES = ["هەولێر", "سلێمانی", "دهۆک", "هەڵەبجە"] as const;

export const IQD_PER_USD = 1460;

// No seed/demo listings — the marketplace starts empty and fills up
// entirely from real accounts posting their own ads.
export const MOCK_LISTINGS: Listing[] = [];
