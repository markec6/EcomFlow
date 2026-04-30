insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public can view profile images" on storage.objects;
create policy "Public can view profile images"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload own profile image" on storage.objects;
create policy "Authenticated users can upload own profile image"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'avatars'
);

drop policy if exists "Authenticated users can update own profile image" on storage.objects;
create policy "Authenticated users can update own profile image"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');
