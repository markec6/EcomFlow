create table if not exists credit_spend_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  product_id text not null,
  action_type text not null default 'deep_scan',
  created_at timestamptz not null default timezone('utc', now()),
  dedupe_bucket bigint generated always as (floor(extract(epoch from created_at) / 10)) stored
);

create unique index if not exists credit_spend_events_dedupe_idx
  on credit_spend_events (user_id, product_id, action_type, dedupe_bucket);

create index if not exists credit_spend_events_lookup_idx
  on credit_spend_events (user_id, product_id, action_type, created_at desc);
