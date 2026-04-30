create extension if not exists "uuid-ossp";

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  image_url text,
  base_cost double precision not null default 0,
  market_price double precision not null default 0,
  margin double precision not null default 0,
  trend_data int4[] not null default '{}',
  saturation_score int4 not null default 0 check (saturation_score >= 0 and saturation_score <= 100),
  competitors jsonb not null default '[]'::jsonb,
  ai_copy_variations jsonb not null default '{}'::jsonb
);

create index if not exists products_name_idx on products using gin (to_tsvector('simple', name));
create index if not exists products_category_idx on products (category);
