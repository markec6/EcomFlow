-- 1) Ensure profile image column exists
alter table public.profiles
add column if not exists avatar_url text;

-- 2) Force PostgREST schema cache reload
notify pgrst, 'reload schema';
