create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  full_name text,
  avatar_url text,
  birth_date date,
  plan_type text not null default 'free',
  ai_credits_remaining int4 not null default 300,
  total_credits_used int4 not null default 0,
  shopify_store_url text,
  created_at timestamptz not null default now()
);

alter table if exists profiles add column if not exists username text unique;
alter table if exists profiles add column if not exists full_name text;
alter table if exists profiles add column if not exists avatar_url text;
alter table if exists profiles add column if not exists birth_date date;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, ai_credits_remaining)
  values (
    new.id,
    new.email,
    case
      when lower(coalesce(new.email, '')) = 'marjanovica773@gmail.com' then 420
      else 300
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
