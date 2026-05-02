-- Ensure RLS is enabled on profiles.
alter table public.profiles enable row level security;

-- Recreate policies safely.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (coalesce(auth.jwt() ->> 'sub', auth.uid()::text) = id)
with check (coalesce(auth.jwt() ->> 'sub', auth.uid()::text) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (coalesce(auth.jwt() ->> 'sub', auth.uid()::text) = id);

drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public"
on public.profiles
for select
to public
using (true);
