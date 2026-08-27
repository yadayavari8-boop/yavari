# بازاڕ — Bazaar Kurdistan

A mobile-first, RTL local buy/sell marketplace for Kurdistan (Erbil, Sulaymaniyah,
Duhok, Halabja), built with Next.js 14 (App Router), TypeScript, Tailwind CSS,
Lucide icons, and a Supabase-shaped Auth/DB layer.

## Design system

| Token | Value | Use |
|---|---|---|
| `brand-500` | `#007A3D` | Primary — deep Kurdish green |
| `sun-500` | `#FDB913` | Featured/VIP badges only (Kurdistan flag sun) |
| `canvas` | `#F9FAFB` | Page background |
| `ink` | `#111827` | Primary text |

Signature element: a 3px red/white/green hairline (`.flag-stripe`, in
`app/globals.css`) beneath the header — the app's one deliberate nod to the
Kurdistan flag, used exactly once so it doesn't turn decorative.

Typeface: **Vazirmatn** (`next/font/google`, subsets `arabic` + `latin`) for
both Kurdish/Arabic and Latin text, loaded as a CSS variable in
`app/layout.tsx` and wired into Tailwind via `fontFamily.sans`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

The app currently renders from `lib/mockData.ts` — categories and cities are
seeded there, but **`MOCK_LISTINGS` starts empty on purpose**: the
marketplace ships with zero demo ads, so the first listings a visitor sees
are ones real accounts actually posted (persisted client-side to
`localStorage` for now — see `lib/store.tsx`). Swap the store's read/write
calls for the `getActiveListings` / `getListingById` / `createListing`
helpers in `lib/supabase.ts` once your Supabase project is provisioned with
`supabase/schema.sql`.

## Directory structure

```
kurdistan-marketplace/
├── app/
│   ├── layout.tsx              # RTL root layout, Vazirmatn font, bottom nav
│   ├── globals.css             # Tailwind layers, flag-stripe, focus states
│   ├── page.tsx                # Homepage feed (search, categories, grid)
│   ├── login/
│   │   ├── page.tsx             # Login route shell (Suspense boundary)
│   │   └── LoginForm.tsx        # Two-step phone+OTP form
│   ├── item/[id]/
│   │   ├── page.tsx            # Item details (gallery, gated CTAs, safety box)
│   │   └── ItemPrice.tsx       # Client subcomponent for currency-aware price
│   ├── post/
│   │   └── page.tsx            # Post-an-ad form (auth-gated)
│   └── profile/
│       └── page.tsx            # Seller dashboard (active/sold, edit/delete)
├── components/
│   ├── Header.tsx               # Sticky header: logo, search, city, currency, account
│   ├── SearchBar.tsx
│   ├── CitySelector.tsx
│   ├── CurrencyToggle.tsx
│   ├── CategoryFilter.tsx
│   ├── FilterSheet.tsx          # Condition + sort filter drawer
│   ├── AuthGate.tsx             # "log in to continue" prompt card
│   ├── ProductCard.tsx
│   ├── SmartImage.tsx           # next/image for remote, <img> for local uploads
│   ├── ImageGallery.tsx
│   ├── SafetyBox.tsx
│   └── BottomNav.tsx            # Mobile tab bar
├── lib/
│   ├── types.ts                 # Domain types (Listing, Category, City...)
│   ├── mockData.ts               # Seed data for local dev
│   ├── format.ts                 # Relative-time formatting (Kurdish)
│   ├── store.tsx                 # City/currency/search + dual-mode listings CRUD
│   ├── idbStore.ts               # Minimal IndexedDB key-value wrapper (local mode)
│   ├── imageUtils.ts             # Client-side photo compression before storage
│   ├── auth.tsx                  # Phone-based session (demo mode, Supabase-ready)
│   ├── sanitize.ts               # LISTING_COLUMNS allowlist + payload sanitizer
│   ├── errors.ts                 # extractMessage() — readable text from any thrown value
│   └── supabase.ts               # Supabase client + Auth/DB/Storage helpers
├── supabase/
│   ├── schema.sql                # Fresh-install schema: users, categories, listings, featured_payments
│   ├── fix_listings_schema.sql   # Idempotent repair script for a drifted live `listings` table
│   └── fix_storage_bucket.sql    # Idempotent fix for "Bucket not found" (listing-photos bucket + policies)
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## Auth flow

Phone-based sign-in, gated on two actions: **posting an ad** and
**contacting a seller** (Call / WhatsApp buttons on the item page). Anyone
can still browse and search without an account.

`lib/auth.tsx` currently runs in **single-step demo mode** — name, phone,
and city are enough to sign in immediately, no verification code. This is
intentional for now; when you're ready to add real phone verification, the
Supabase OTP calls are already sitting in `lib/supabase.ts` ready to wire
in:

```ts
await requestOtp(phone);                      // sends real SMS
await verifyOtp(phone, code);                 // returns a Supabase session
```

Wire an SMS provider (Twilio, MessageBird, Vonage) under
**Authentication → Providers → Phone** in the Supabase dashboard when that
happens. The DB trigger `on_auth_user_created` in `supabase/schema.sql`
already auto-creates the matching `public.users` profile row on first
verification.

A posted listing's seller **name** always comes from the signed-in account.
The **contact phone** is pre-filled from the account too, but stays
editable per-listing on the post form — sellers can override it if their
number on file is outdated or was mistyped at signup.

## Cloud sync vs. local-only mode — and why ads didn't show on other devices

The app runs in one of two modes, decided automatically by whether
Supabase credentials are set:

- **Local mode (default, no setup)** — listings live in this browser's own
  IndexedDB (`lib/idbStore.ts`). This is why a listing posted on a PC never
  showed up on a phone: they're two completely separate, sandboxed storage
  areas with no connection between them. There's no way to fix that from
  the client side alone — it needs a shared backend.
- **Cloud mode** — once `.env.local` has real Supabase credentials
  (`isSupabaseConfigured` in `lib/supabase.ts` flips to `true`), listings
  read from and write to a shared Postgres table instead, and a Realtime
  subscription pushes new/changed/deleted listings to every connected
  device live — no refresh needed. `useAppStore().syncMode` reports which
  mode is active, and a small dismissible banner
  (`components/SyncModeBanner.tsx`) tells people when they're in local
  mode so it isn't a silent surprise.

**To turn on cloud mode (~5 minutes):**

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/schema.sql` — this creates the
   tables, seeds categories, and sets up the `listing-photos` storage
   bucket.
3. Copy **Project URL** and **anon public key** from Settings → API into
   `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the dev server / redeploy. Listings now sync across every
   device automatically.

### Photo storage & compression

Every uploaded photo is downscaled (max 1280px) and re-encoded as JPEG
client-side (`lib/imageUtils.ts`) before it's stored anywhere, typically
shrinking a multi-MB phone photo to well under 300KB. In local mode this
keeps IndexedDB's quota from being an issue; in cloud mode it keeps
uploads to the `listing-photos` bucket fast and cheap.

Posting an ad now `await`s confirmed persistence (`addListing()` in
`lib/store.tsx`) before showing "posted!" — if a save genuinely fails, the
form shows a real error instead of a false success that quietly loses the
ad. Anyone who posted ads on an older `localStorage`-based build won't
lose them either — the store migrates that data into IndexedDB
automatically the first time the app loads.

### A known trade-off worth knowing about

Since login (`lib/auth.tsx`) is currently a lightweight local sign-in
(name + phone + city, no SMS code) rather than real Supabase phone-auth,
`supabase/schema.sql`'s Row Level Security policies are intentionally left
**open** — anyone with the app's public anon key can technically insert,
update, or delete any listing, not just their own. That's a reasonable
trade-off for getting cross-device sync working now without adding back
the OTP step, but it should be tightened before a real public launch:
switch `lib/auth.tsx` over to the `requestOtp`/`verifyOtp` calls already
sitting in `lib/supabase.ts`, then change the RLS policies from
`using (true)` to `auth.uid()::text = seller_id` (the schema file's
comments mark exactly where).

## Fixing "column not found in schema cache" errors

If your live Supabase `listings` table has drifted out of sync with the
app (a common symptom: every fix reveals another missing column), run
`supabase/fix_listings_schema.sql` instead of hand-patching columns one at
a time. It's fully idempotent — every statement uses `IF NOT EXISTS` /
`DROP...IF EXISTS`, so it's safe to paste into the Supabase SQL editor and
run repeatedly from any starting state. It also ends with
`notify pgrst, 'reload schema';` to force PostgREST to pick up the change
immediately (if a stale-schema error still shows up afterward, use
**Project Settings → API → Reload schema** in the dashboard as a manual
fallback — this is occasionally needed with a pooled connection in
transaction mode).

Two code-level safeguards now back this up so the same class of error is
much harder to hit again:

- **`lib/sanitize.ts`** exports `LISTING_COLUMNS` — the single source of
  truth for every real column on the table — and `sanitizePayload()`,
  which strips any key not in that list (plus any `undefined` values)
  before a payload is sent. `insertListing()`/`updateListingRow()` in
  `lib/supabase.ts` both run every payload through it automatically, so a
  stray or renamed frontend field can no longer reach PostgREST at all.
- Those same two functions log the exact sanitized payload to the console
  in development (`[supabase] insert → listings payload: ...`) right
  before the request goes out — open devtools when submitting the post
  form to see precisely what's being sent, or check the Network tab for
  the raw REST request to Supabase if you want to see it after
  client-side transformations too.

## Fixing "Bucket not found" errors

Storage buckets are separate from database tables — running the column
migration alone doesn't create them. If posting an ad fails with
`Bucket not found` (shown after uploading a photo, before the listing
saves), run `supabase/fix_storage_bucket.sql` in the SQL editor. It
creates the `listing-photos` bucket (public, so photos display without
auth) plus its read/upload/delete policies, and is safe to re-run anytime.

If that script itself errors, the file has manual dashboard steps in its
trailing comment (Storage → New bucket → name it `listing-photos` → toggle
Public on → still run the four `create policy` statements from the script
afterward, since the dashboard alone doesn't add those).

The post form now also tells these two failure modes apart automatically:
a bucket problem shows a specific "storage bucket not set up" message
pointing at this fix, instead of the generic save-failed message — see
`extractMessage()` in `lib/errors.ts` and the upload-vs-save error
handling in `app/post/page.tsx`.

## Featured / VIP listings — currently disabled

Every listing is shown as a normal ad for now; there is no paid promotion,
no VIP badge, and no payment step anywhere in the UI. The `is_featured`
column and the `featured_payments` table are still defined in
`supabase/schema.sql` so this can be re-enabled later without a schema
migration — just re-add the promote toggle to the post form and the badge
back to `ProductCard`/the item page.
