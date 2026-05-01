alter table public.profiles
  add column if not exists public_bio text,
  add column if not exists theme_preference text default 'dark',
  add column if not exists dark_mode boolean default true,
  add column if not exists email_alerts boolean default true,
  add column if not exists public_profile boolean default false;

notify pgrst, 'reload schema';
