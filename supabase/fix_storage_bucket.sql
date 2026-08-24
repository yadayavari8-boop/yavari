-- ============================================================================
-- Bazaar Kurdistan — storage bucket fix
--
-- Fixes: "Bucket not found" when uploading a photo on the post-ad form.
--
-- Storage buckets are separate from database tables, so running the table
-- migration alone isn't enough — this creates the `listing-photos` bucket
-- (public, so photos can be viewed without auth) and its access policies.
-- Idempotent: safe to run as many times as you want.
--
-- Run in Supabase → SQL Editor → New query → Run.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public read listing photos"   on storage.objects;
drop policy if exists "public upload listing photos" on storage.objects;
drop policy if exists "public delete listing photos" on storage.objects;

create policy "public read listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos');

create policy "public upload listing photos" on storage.objects
  for insert with check (bucket_id = 'listing-photos');

create policy "public delete listing photos" on storage.objects
  for delete using (bucket_id = 'listing-photos');

-- ---------------------------------------------------------------------------
-- If this script itself errors with a permissions issue (rare, but can
-- happen depending on project configuration), create the bucket manually
-- instead — it takes under a minute:
--
--   1. Supabase Dashboard → Storage → "New bucket"
--   2. Name: listing-photos
--   3. Toggle "Public bucket" ON
--   4. Create
--   5. Then still run the four `create policy` statements above in the
--      SQL editor — the dashboard bucket creation alone doesn't add them.
-- ---------------------------------------------------------------------------
