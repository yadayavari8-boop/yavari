import { createClient } from "@supabase/supabase-js";
import { sanitizePayload } from "./sanitize";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True once real Supabase credentials are set in .env.local. Until then,
 * the app falls back to a per-device IndexedDB store (see lib/store.tsx) —
 * which is why listings posted on one device won't show up on another.
 * Listings only become shared across devices once this is true.
 */
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project");

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

/**
 * ---------------------------------------------------------------------
 * Phone-based auth (Supabase paradigm)
 * ---------------------------------------------------------------------
 * Supabase's phone-auth flow maps onto a two-step OTP UX:
 *
 *   1) signInWithOtp({ phone })   -> sends a 6-digit SMS code
 *   2) verifyOtp({ phone, token, type: "sms" }) -> exchanges the code
 *      for a session (creates the `auth.users` row on first login)
 *
 * The app currently uses a lighter-weight local sign-in (lib/auth.tsx)
 * with no code entry, by request — so `listings.seller_id` isn't tied to
 * a real `auth.uid()` yet, and the RLS insert/update policies in
 * supabase/schema.sql are intentionally left open rather than
 * auth-scoped. Wire these two calls in when you're ready to require real
 * phone verification, then tighten the RLS policies back to
 * `auth.uid() = seller_id` (the schema comments show exactly where).
 * ---------------------------------------------------------------------
 */

export async function requestOtp(phone: string) {
  return supabase.auth.signInWithOtp({ phone });
}

export async function verifyOtp(phone: string, token: string) {
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}

export async function fetchListings() {
  return supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function fetchListingById(id: string) {
  return supabase.from("listings").select("*").eq("id", id).single();
}

export async function insertListing(payload: Record<string, unknown>) {
  // Strip anything that isn't a real `listings` column (and any `undefined`
  // values) before this ever reaches PostgREST — this is what prevents a
  // stray/renamed frontend field from ever causing a
  // "column not found in schema cache" error again.
  const clean = sanitizePayload(payload);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[supabase] insert → listings payload:", clean);
  }

  return supabase.from("listings").insert(clean).select().single();
}

export async function updateListingRow(id: string, patch: Record<string, unknown>) {
  const clean = sanitizePayload(patch);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[supabase] update → listings payload:", { id, clean });
  }

  return supabase.from("listings").update(clean).eq("id", id).select().single();
}

export async function deleteListingRow(id: string) {
  return supabase.from("listings").delete().eq("id", id);
}

/** Uploads one compressed photo to the public `listing-photos` bucket, returns its public URL. */
export async function uploadListingPhoto(blob: Blob, userId: string): Promise<string> {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage
    .from("listing-photos")
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadListingPhotos(blobs: Blob[], userId: string): Promise<string[]> {
  return Promise.all(blobs.map((b) => uploadListingPhoto(b, userId)));
}
