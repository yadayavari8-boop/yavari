-- ============================================================================
-- Bazaar Kurdistan — Database Schema (Supabase / PostgreSQL)
-- Local buy/sell marketplace, currently running lightweight sign-in
-- (name + phone + city, no SMS code) instead of full Supabase phone-auth.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------
create type city_enum as enum ('هەولێر', 'سلێمانی', 'دهۆک', 'هەڵەبجە');
create type condition_enum as enum ('new', 'used');
create type currency_enum as enum ('IQD', 'USD');
create type payment_status_enum as enum ('pending', 'paid', 'failed', 'refunded');

-- ---------------------------------------------------------------------------
-- USERS
-- Informational profile table. Not currently linked to auth.users or
-- referenced by listings.seller_id — see the note on listings below for why.
-- Once real Supabase phone-auth (requestOtp/verifyOtp in lib/supabase.ts)
-- is wired in, re-connect this via the trigger at the bottom of this file.
-- ---------------------------------------------------------------------------
create table public.users (
  id            uuid primary key default uuid_generate_v4(),
  full_name     text not null,
  phone         text not null,                       -- E.164 format, e.g. +9647501234567
                                                       -- NOT unique on purpose: signing up
                                                       -- always creates a new account, even
                                                       -- for a phone already registered — see
                                                       -- lib/auth.tsx signUp(). Sign-in resolves
                                                       -- to the most recently created match.
  city          city_enum not null default 'هەولێر',
  avatar_url    text,
  is_verified   boolean not null default false,      -- true once real phone OTP is wired in
  rating        numeric(2,1) not null default 5.0,
  created_at    timestamptz not null default now()
);

create index users_phone_idx on public.users (phone);

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- Small, fixed lookup table — seeded below.
-- ---------------------------------------------------------------------------
create table public.categories (
  slug          text primary key,                    -- 'cars', 'electronics', ...
  name_ckb      text not null,                        -- Central Kurdish (Sorani) label
  name_en       text not null,
  icon          text not null,                        -- lucide-react icon name
  sort_order    smallint not null default 0
);

insert into public.categories (slug, name_ckb, name_en, icon, sort_order) values
  ('cars',         'ئۆتۆمبێل',        'Cars',         'Car',       1),
  ('electronics',  'ئەلیکترۆنی',      'Electronics',  'Smartphone',2),
  ('real-estate',  'خانوبەرە',        'Real Estate',  'Home',      3),
  ('home-goods',   'کەلوپەلی ماڵ',    'Home Goods',   'Sofa',      4),
  ('fashion',      'جل و بەرگ',       'Fashion',      'Shirt',     5),
  ('jobs',         'کارو بار',        'Jobs',         'Briefcase', 6),
  ('instruments',  'ئامێری مۆسیقی',   'Instruments',  'Music',     7),
  ('perfumes',     'عەتر و بۆن',      'Perfumes',     'SprayCan',  8);

-- ---------------------------------------------------------------------------
-- LISTINGS
--
-- NOTE on seller_id: this is intentionally a plain `text` field, not a uuid
-- foreign key into auth.users/public.users. The app currently signs people
-- in locally (name + phone + city, no SMS verification) rather than through
-- real Supabase Auth, so there is no auth.uid() to key off yet. seller_id
-- is just whatever id the client's lightweight session generated — the
-- listing's seller_name/seller_phone columns already carry everything
-- needed to display and contact the seller, independent of that id.
--
-- When you're ready to require real phone verification: switch
-- lib/auth.tsx over to requestOtp/verifyOtp in lib/supabase.ts, change this
-- column to `uuid references public.users(id)`, and tighten the RLS
-- policies below from "open" to `auth.uid() = seller_id`.
-- ---------------------------------------------------------------------------
create table public.listings (
  id              uuid primary key default uuid_generate_v4(),
  seller_id       text not null,
  seller_name     text not null,
  seller_phone    text not null,                       -- E.164 format
  category        text not null references public.categories(slug),
  title_ckb       text not null,
  description_ckb text not null default '',
  price_iqd       bigint not null check (price_iqd >= 0),
  price_usd       numeric(12,2) not null check (price_usd >= 0),
  currency_default currency_enum not null default 'IQD',
  condition       condition_enum not null default 'used',
  city            city_enum not null,
  neighborhood    text,
  images          text[] not null default '{}',        -- public URLs from the listing-photos bucket
  is_featured     boolean not null default false,       -- reserved for future paid promotion — unused for now
  is_sold         boolean not null default false,
  view_count      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index listings_city_idx        on public.listings (city);
create index listings_category_idx    on public.listings (category);
create index listings_active_feed_idx on public.listings (is_sold, created_at desc);
create index listings_seller_idx      on public.listings (seller_id);

-- ---------------------------------------------------------------------------
-- FEATURED_PAYMENTS
-- Not currently used by the app (no paid promotion right now) — kept here
-- so re-enabling it later doesn't require a schema migration.
-- ---------------------------------------------------------------------------
create table public.featured_payments (
  id              uuid primary key default uuid_generate_v4(),
  listing_id      uuid not null references public.listings(id) on delete cascade,
  seller_id       text not null,
  plan            text not null default 'vip_7day',
  amount_iqd      bigint not null check (amount_iqd >= 0),
  status          payment_status_enum not null default 'pending',
  payment_ref     text,
  starts_at       timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_touch_updated_at
before update on public.listings
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--
-- These policies are deliberately OPEN (not scoped to auth.uid()) because
-- there is no real Supabase Auth session yet — see the note on the listings
-- table above. That means anyone with the anon key can technically insert,
-- update, or delete any listing, not just their own. That's an acceptable
-- trade-off for an early/internal build, but tighten this before a public
-- launch: once real phone verification is wired in, replace `using (true)`
-- / `with check (true)` below with `auth.uid()::text = seller_id`.
-- ---------------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.listings          enable row level security;
alter table public.featured_payments enable row level security;

create policy "public read users"   on public.users for select using (true);
create policy "public insert users" on public.users for insert with check (true);

create policy "public read listings"   on public.listings for select using (true);
create policy "public insert listings" on public.listings for insert with check (true);
create policy "public update listings" on public.listings for update using (true);
create policy "public delete listings" on public.listings for delete using (true);

create policy "public read payments"   on public.featured_payments for select using (true);
create policy "public insert payments" on public.featured_payments for insert with check (true);

-- ---------------------------------------------------------------------------
-- STORAGE — listing photos
-- Public bucket: anyone can view photos, anyone can upload (same open
-- trade-off as above, until real auth is wired in).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "public read listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos');

create policy "public upload listing photos" on storage.objects
  for insert with check (bucket_id = 'listing-photos');

create policy "public delete listing photos" on storage.objects
  for delete using (bucket_id = 'listing-photos');
