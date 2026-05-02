-- ============================================================
-- ECOM-FLOW — RLS POLICIES
-- Run this entire block in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── IMPORTANT: Clerk + Supabase ID mapping ──────────────────
-- This app uses Clerk for authentication, NOT Supabase native auth.
-- Clerk user IDs are strings like "user_2abc...".
-- Supabase's auth.uid() returns a UUID from Supabase's own auth
-- system — it is always NULL in this setup.
-- We use auth.jwt() ->> 'sub' instead, which contains the Clerk
-- user ID when a Clerk-signed JWT is forwarded to Supabase.
-- Server-side API routes use the Service Role key, which bypasses
-- all RLS automatically — no JWT needed there.
-- ─────────────────────────────────────────────────────────────


-- ─── 1. PROFILES TABLE ───────────────────────────────────────

alter table public.profiles enable row level security;

-- Anyone can read profiles (required for dashboard header, etc.)
drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public"
  on public.profiles
  for select
  to public
  using (true);

-- Authenticated users can insert their own profile row.
-- Uses Clerk JWT sub claim as the identifier.
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (
    coalesce(auth.jwt() ->> 'sub', auth.uid()::text) = id
  );

-- Authenticated users can update only their own profile row.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using  (coalesce(auth.jwt() ->> 'sub', auth.uid()::text) = id)
  with check (coalesce(auth.jwt() ->> 'sub', auth.uid()::text) = id);


-- ─── 2. AVATARS STORAGE BUCKET ───────────────────────────────

-- Create the bucket if it doesn't already exist.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Anyone can read/view avatar images (the bucket is public).
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

-- Authenticated users can upload into their own subfolder.
-- Folder name must match their Clerk user ID (e.g. avatars/user_2abc.../file).
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = coalesce(auth.jwt() ->> 'sub', auth.uid()::text)
  );

-- Authenticated users can replace (upsert) their own avatar files.
drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = coalesce(auth.jwt() ->> 'sub', auth.uid()::text)
  );

-- Authenticated users can delete their own avatar files.
drop policy if exists "Users can delete own avatars" on storage.objects;
create policy "Users can delete own avatars"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = coalesce(auth.jwt() ->> 'sub', auth.uid()::text)
  );
