create table if not exists vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  category text,
  cost double precision not null default 0,
  srp double precision not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create index if not exists vault_user_id_idx on vault(user_id);
