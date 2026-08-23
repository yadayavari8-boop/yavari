import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * ---------------------------------------------------------------------
 * Phone-based passwordless auth (Supabase paradigm)
 * ---------------------------------------------------------------------
 * Supabase's phone-auth flow maps directly onto this two-step OTP UX:
 *
 *   1) signInWithOtp({ phone })   -> sends a 6-digit SMS code
 *   2) verifyOtp({ phone, token, type: "sms" }) -> exchanges the code
 *      for a session (creates the `auth.users` row on first login)
 *
 * Wire an SMS provider (Twilio / MessageBird / Vonage) in the Supabase
 * dashboard under Authentication > Providers > Phone before going live.
 * ---------------------------------------------------------------------
 */

export async function requestOtp(phone: string) {
  return supabase.auth.signInWithOtp({ phone });
}

export async function verifyOtp(phone: string, token: string) {
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}

export async function getActiveListings(city?: string, category?: string) {
  let query = supabase
    .from("listings")
    .select("*")
    .eq("is_sold", false)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (city) query = query.eq("city", city);
  if (category) query = query.eq("category", category);

  return query;
}

export async function getListingById(id: string) {
  return supabase.from("listings").select("*, users(*)").eq("id", id).single();
}

export async function createListing(payload: Record<string, unknown>) {
  return supabase.from("listings").insert(payload).select().single();
}
