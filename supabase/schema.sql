-- ============================================================================
-- Bazaar Kurdistan — Database Schema (Supabase / PostgreSQL)
-- Phone-first, RLS-secured schema for a local buy/sell marketplace.
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
-- Mirrors/extends Supabase's built-in `auth.users` (phone-based auth).
-- One row is created here via a trigger the first time someone verifies
-- their SMS OTP.
-- ---------------------------------------------------------------------------
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text not null unique,               -- E.164 format, e.g. +9647501234567
  city          city_enum not null default 'هەولێر',
  avatar_url    text,
  is_verified   boolean not null default false,      -- phone OTP confirmed
  rating        numeric(2,1) not null default 5.0,
  created_at    timestamptz not null default now()
);

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
-- ---------------------------------------------------------------------------
create table public.listings (
  id              uuid primary key default uuid_generate_v4(),
  seller_id       uuid not null references public.users(id) on delete cascade,
  category        text not null references public.categories(slug),
  title_ckb       text not null,
  description_ckb text not null default '',
  price_iqd       bigint not null check (price_iqd >= 0),
  price_usd       numeric(12,2) not null check (price_usd >= 0),
  currency_default currency_enum not null default 'IQD',
  condition       condition_enum not null default 'used',
  city            city_enum not null,
  neighborhood    text,
  images          text[] not null default '{}',        -- Supabase Storage public URLs
  is_featured     boolean not null default false,       -- true while a featured_payments row is active
  is_sold         boolean not null default false,
  view_count      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index listings_city_idx        on public.listings (city);
create index listings_category_idx    on public.listings (category);
create index listings_active_feed_idx on public.listings (is_sold, is_featured desc, created_at desc);
create index listings_seller_idx      on public.listings (seller_id);

-- ---------------------------------------------------------------------------
-- FEATURED_PAYMENTS
-- Records the "Promote Listing" upsell — each row represents one paid
-- boost window for a listing (e.g. 7-day VIP placement).
-- ---------------------------------------------------------------------------
create table public.featured_payments (
  id              uuid primary key default uuid_generate_v4(),
  listing_id      uuid not null references public.listings(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  plan            text not null default 'vip_7day',     -- 'vip_3day' | 'vip_7day' | 'vip_30day'
  amount_iqd      bigint not null check (amount_iqd >= 0),
  status          payment_status_enum not null default 'pending',
  payment_ref     text,                                  -- gateway transaction id (FastPay, FIB, etc.)
  starts_at       timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index featured_payments_listing_idx on public.featured_payments (listing_id);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

-- Keep `updated_at` fresh on listings.
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

-- Auto-create a public.users profile row when someone verifies phone OTP
-- for the first time (auth.users insert).
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, full_name, phone, is_verified)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'بەکارهێنەر'), new.phone, true)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- When a featured_payments row is marked 'paid', flip the listing's
-- is_featured flag on; a scheduled job (pg_cron) flips it off at expires_at.
create or replace function public.activate_featured_listing()
returns trigger language plpgsql as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    update public.listings
      set is_featured = true
      where id = new.listing_id;
  end if;
  return new;
end;
$$;

create trigger featured_payments_activate
after update on public.featured_payments
for each row execute function public.activate_featured_listing();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.listings          enable row level security;
alter table public.featured_payments enable row level security;

-- USERS: everyone can read basic seller info; only the owner can edit it.
create policy "public read users"   on public.users for select using (true);
create policy "self update users"   on public.users for update using (auth.uid() = id);

-- LISTINGS: anyone can browse active listings; only the owning seller can
-- create/update/delete their own.
create policy "public read listings" on public.listings
  for select using (true);

create policy "owner insert listings" on public.listings
  for insert with check (auth.uid() = seller_id);

create policy "owner update listings" on public.listings
  for update using (auth.uid() = seller_id);

create policy "owner delete listings" on public.listings
  for delete using (auth.uid() = seller_id);

-- FEATURED_PAYMENTS: sellers can see/create their own payment records only.
create policy "owner read payments" on public.featured_payments
  for select using (auth.uid() = user_id);

create policy "owner insert payments" on public.featured_payments
  for insert with check (auth.uid() = user_id);
