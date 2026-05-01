create table if not exists profiles (
  id text primary key,
  email text,
  plan_type text not null default 'FREE',
  ai_credits_remaining int4 not null default 300,
  total_credits_used int4 not null default 0,
  shopify_store_url text,
  created_at timestamptz not null default now()
);

alter table if exists profiles add column if not exists plan_type text not null default 'FREE';
alter table if exists profiles add column if not exists ai_credits_remaining int4 not null default 300;
alter table if exists profiles add column if not exists total_credits_used int4 not null default 0;
