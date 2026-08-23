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
│   ├── store.tsx                 # City/currency/search + persisted listings CRUD
│   ├── idbStore.ts               # Minimal IndexedDB key-value wrapper
│   ├── imageUtils.ts             # Client-side photo compression before storage
│   ├── auth.tsx                  # Phone-based session (demo mode, Supabase-ready)
│   └── supabase.ts               # Supabase client + Auth/DB helpers
├── supabase/
│   └── schema.sql                # users, categories, listings, featured_payments
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

## Photo storage & why posted ads used to vanish

Listings (including their photos) are persisted in **IndexedDB**
(`lib/idbStore.ts`), not `localStorage`. An earlier build used
`localStorage`, which caps out around 5-10MB per site — one or two
full-resolution phone photos can exceed that on their own, so the save
would silently fail and the ad would disappear on the next reload.

Two fixes now cover this:

1. **Compression first** (`lib/imageUtils.ts`) — every uploaded photo is
   downscaled (max 1280px) and re-encoded as JPEG before it ever touches
   state or storage, typically shrinking a multi-MB photo to well under
   300KB.
2. **Confirmed writes** — `addListing()` in `lib/store.tsx` is now
   `async` and the post form (`app/post/page.tsx`) `await`s it. If the
   save genuinely fails (e.g. IndexedDB unavailable), the form shows an
   error immediately instead of a false "posted!" message that quietly
   loses the ad.

Anyone who posted ads on the old `localStorage`-based build won't lose
them — the store migrates that data into IndexedDB automatically the
first time the app loads.

## Featured / VIP listings — currently disabled

Every listing is shown as a normal ad for now; there is no paid promotion,
no VIP badge, and no payment step anywhere in the UI. The `is_featured`
column and the `featured_payments` table are still defined in
`supabase/schema.sql` so this can be re-enabled later without a schema
migration — just re-add the promote toggle to the post form and the badge
back to `ProductCard`/the item page.
