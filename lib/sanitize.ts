/**
 * Canonical set of columns that exist on the `listings` table. Keep this in
 * sync with supabase/fix_listings_schema.sql — it's the single source of
 * truth used to strip any unexpected key (typo, leftover field, stale
 * frontend state) out of a payload before it's sent to Supabase, so a
 * mismatched field can never trigger a
 * "Could not find the 'X' column ... schema cache" error again.
 */
export const LISTING_COLUMNS = [
  "id",
  "seller_id",
  "seller_name",
  "seller_phone",
  "category",
  "city",
  "neighborhood",
  "condition",
  "currency_default",
  "price_iqd",
  "price_usd",
  "title_ckb",
  "title_ar",
  "title_en",
  "description_ckb",
  "description_ar",
  "description_en",
  "images",
  "is_featured",
  "is_sold",
  "view_count",
  "created_at",
  "updated_at",
] as const;

export type ListingColumn = (typeof LISTING_COLUMNS)[number];

/**
 * Same idea as LISTING_COLUMNS, for the `users` table — used when signing
 * up/in against a real Supabase backend (see lib/auth.tsx).
 */
export const USER_COLUMNS = [
  "id",
  "full_name",
  "phone",
  "city",
  "avatar_url",
  "is_verified",
  "rating",
  "created_at",
] as const;

export type UserColumn = (typeof USER_COLUMNS)[number];

/**
 * Strips any key not in `allowedKeys` and drops keys whose value is
 * `undefined` (Supabase's client sends `undefined` fields as literal
 * `null` writes otherwise, which is rarely what you want). Returns a new
 * object — the input is never mutated.
 */
export function sanitizePayload<T extends Record<string, unknown>>(
  payload: T,
  allowedKeys: readonly string[] = LISTING_COLUMNS
): Partial<T> {
  const clean: Partial<T> = {};
  for (const key of Object.keys(payload) as (keyof T)[]) {
    if (!allowedKeys.includes(key as string)) continue;
    const value = payload[key];
    if (value === undefined) continue;
    clean[key] = value;
  }
  return clean;
}
