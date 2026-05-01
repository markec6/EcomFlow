-- 1) Ensure required columns exist for webhook initialization.
alter table public.profiles
  add column if not exists plan_type text default 'FREE',
  add column if not exists ai_credits_remaining int4 default 300,
  add column if not exists total_credits_used int4 default 0;

-- 2) Detect id type mismatch (Clerk user ids are strings like user_xxx).
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'id';

-- 3) If id is uuid, convert it to text (required for Clerk id parity).
do $$
declare
  id_type text;
begin
  select data_type
  into id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'id';

  if id_type = 'uuid' then
    alter table public.profiles
      alter column id type text using id::text;
  end if;
end
$$;

-- 4) Inspect active RLS policies on profiles.
select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles';

-- 5) Keep RLS enabled; service role bypasses RLS for webhook inserts.
alter table public.profiles enable row level security;

notify pgrst, 'reload schema';
