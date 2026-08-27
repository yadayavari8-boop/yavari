-- ============================================================================
-- Bazaar Kurdistan — users table REPAIR script
--
-- Fixes: "sign up" needs to always create a new account, even for a phone
-- number that's already registered — which the original `unique` constraint
-- on `users.phone` would block (insert would fail with a duplicate-key
-- error). This drops that constraint and makes sure the table/RLS state
-- otherwise matches what the app expects. Idempotent — safe to re-run.
--
-- Run in Supabase → SQL Editor → New query → Run.
-- ============================================================================

do $$ begin
  create type city_enum as enum ('هەولێر', 'سلێمانی', 'دهۆک', 'هەڵەبجە');
exception when duplicate_object then null; end $$;

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now()
);

alter table public.users add column if not exists full_name    text;
alter table public.users add column if not exists phone        text;
alter table public.users add column if not exists city         city_enum default 'هەولێر';
alter table public.users add column if not exists avatar_url   text;
alter table public.users add column if not exists is_verified  boolean default false;
alter table public.users add column if not exists rating       numeric(2,1) default 5.0;

update public.users set full_name = coalesce(full_name, 'بەکارهێنەر') where full_name is null;
update public.users set phone     = coalesce(phone, '')              where phone is null;

-- Drop the unique constraint on phone, whatever it happens to be named —
-- this is the actual fix. Covers the common default name plus a
-- defensive lookup in case it was created with a different name.
alter table public.users drop constraint if exists users_phone_key;
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.users'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%phone%'
  loop
    execute format('alter table public.users drop constraint %I', c.conname);
  end loop;
end $$;

create index if not exists users_phone_idx on public.users (phone);

alter table public.users enable row level security;

drop policy if exists "public read users"   on public.users;
drop policy if exists "public insert users" on public.users;

create policy "public read users"   on public.users for select using (true);
create policy "public insert users" on public.users for insert with check (true);

notify pgrst, 'reload schema';
