alter table public.profiles
  add column if not exists plan_type text default 'FREE',
  add column if not exists ai_credits_remaining int4 default 300,
  add column if not exists total_credits_used int4 default 0;

notify pgrst, 'reload schema';
