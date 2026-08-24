-- ============================================================================
-- Bazaar Kurdistan — listings table REPAIR script
--
-- Use this when your live `listings` table has drifted from the app's
-- expected columns (the "Could not find the 'X' column ... schema cache"
-- error). Unlike a plain CREATE TABLE script, every statement here is
-- idempotent — IF NOT EXISTS / OR REPLACE / DROP...IF EXISTS — so it is
-- safe to paste into the Supabase SQL editor and run as many times as you
-- want, from any starting state (missing table, partial table, or already
-- correct table). It always converges to the same end result instead of
-- erroring on a re-run.
--
-- Run this whole file in one go: Supabase → SQL Editor → New query → Run.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---- ENUM types --------------------------------------------------------
-- CREATE TYPE has no IF NOT EXISTS in Postgres, so guard it manually.
do $$ begin
  create type city_enum as enum ('هەولێر', 'سلێمانی', 'دهۆک', 'هەڵەبجە');
exception when duplicate_object then null; end $$;

do $$ begin
  create type condition_enum as enum ('new', 'used');
exception when duplicate_object then null; end $$;

do $$ begin
  create type currency_enum as enum ('IQD', 'USD');
exception when duplicate_object then null; end $$;

-- ---- Table (created fresh only if it doesn't exist yet) ----------------
create table if not exists public.listings (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now()
);

-- ---- Columns — the actual fix ------------------------------------------
-- Every column the frontend can possibly send is guaranteed to exist here,
-- regardless of what state the table was already in. This is what stops
-- the "missing column" error from recurring one field at a time.
alter table public.listings add column if not exists seller_id         text;
alter table public.listings add column if not exists seller_name       text;
alter table public.listings add column if not exists seller_phone      text;
alter table public.listings add column if not exists category          text;
alter table public.listings add column if not exists city              city_enum;
alter table public.listings add column if not exists neighborhood      text;
alter table public.listings add column if not exists condition         condition_enum default 'used';
alter table public.listings add column if not exists currency_default  currency_enum default 'IQD';
alter table public.listings add column if not exists price_iqd         bigint default 0;
alter table public.listings add column if not exists price_usd         numeric(12,2) default 0;
alter table public.listings add column if not exists images            text[] default '{}';
alter table public.listings add column if not exists is_featured       boolean default false;
alter table public.listings add column if not exists is_sold           boolean default false;
alter table public.listings add column if not exists view_count        integer default 0;
alter table public.listings add column if not exists updated_at        timestamptz default now();

-- Localized text fields: Kurdish (Sorani) is what the current UI writes to;
-- Arabic and English are added as nullable extras so you can start filling
-- them in later without another migration.
alter table public.listings add column if not exists title_ckb         text;
alter table public.listings add column if not exists title_ar          text;
alter table public.listings add column if not exists title_en          text;
alter table public.listings add column if not exists description_ckb   text default '';
alter table public.listings add column if not exists description_ar    text;
alter table public.listings add column if not exists description_en    text;

-- Backfill any pre-existing rows so NOT NULL-style app assumptions hold
-- even for rows inserted before some of these columns existed.
update public.listings set seller_id    = coalesce(seller_id, 'unknown')   where seller_id is null;
update public.listings set seller_name  = coalesce(seller_name, 'Unknown') where seller_name is null;
update public.listings set seller_phone = coalesce(seller_phone, '')       where seller_phone is null;
update public.listings set category     = coalesce(category, 'other')     where category is null;
update public.listings set title_ckb    = coalesce(title_ckb, '')         where title_ckb is null;
update public.listings set description_ckb = coalesce(description_ckb, '') where description_ckb is null;

-- ---- Indexes -------------------------------------------------------------
create index if not exists listings_city_idx        on public.listings (city);
create index if not exists listings_category_idx    on public.listings (category);
create index if not exists listings_active_feed_idx on public.listings (is_sold, created_at desc);
create index if not exists listings_seller_idx      on public.listings (seller_id);

-- ---- updated_at trigger ---------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_touch_updated_at on public.listings;
create trigger listings_touch_updated_at
before update on public.listings
for each row execute function public.touch_updated_at();

-- ---- RLS: public read/insert/update/delete --------------------------------
-- Open for now since there's no real Supabase Auth session tied to
-- listings.seller_id yet (see supabase/schema.sql for the full note on
-- this trade-off and how to tighten it later).
alter table public.listings enable row level security;

drop policy if exists "public read listings"   on public.listings;
drop policy if exists "public insert listings" on public.listings;
drop policy if exists "public update listings" on public.listings;
drop policy if exists "public delete listings" on public.listings;

create policy "public read listings"   on public.listings for select using (true);
create policy "public insert listings" on public.listings for insert with check (true);
create policy "public update listings" on public.listings for update using (true);
create policy "public delete listings" on public.listings for delete using (true);

-- ---- Storage bucket for listing photos -------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read listing photos"   on storage.objects;
drop policy if exists "public upload listing photos" on storage.objects;
drop policy if exists "public delete listing photos" on storage.objects;

create policy "public read listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos');
create policy "public upload listing photos" on storage.objects
  for insert with check (bucket_id = 'listing-photos');
create policy "public delete listing photos" on storage.objects
  for delete using (bucket_id = 'listing-photos');

-- ---- Force PostgREST to pick up the schema change immediately -------------
-- This is the other half of the fix: adding a column doesn't help if the
-- REST layer's cached schema doesn't know about it yet. NOTIFY normally
-- takes effect within a few seconds. If you *still* see a stale-schema
-- error after running this script, go to
-- Supabase Dashboard → Project Settings → API → "Reload schema" as a
-- manual fallback (this is occasionally needed when using a pooled
-- connection in transaction mode, which can swallow NOTIFY).
notify pgrst, 'reload schema';
