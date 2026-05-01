insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = true;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
drop policy if exists "Users can upload their own avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;
drop policy if exists "Users can delete their own avatars" on storage.objects;

create policy "Avatar images are publicly readable"
on storage.objects
for select
using (bucket_id = 'avatars');

create policy "Users can upload their own avatars"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = coalesce(auth.jwt() ->> 'sub', auth.uid()::text)
);

create policy "Users can update their own avatars"
on storage.objects
for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = coalesce(auth.jwt() ->> 'sub', auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = coalesce(auth.jwt() ->> 'sub', auth.uid()::text)
);

create policy "Users can delete their own avatars"
on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = coalesce(auth.jwt() ->> 'sub', auth.uid()::text)
);
