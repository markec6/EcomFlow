alter table if exists products
  add column if not exists name text,
  add column if not exists category text,
  add column if not exists image_url text,
  add column if not exists base_cost double precision default 0,
  add column if not exists market_price double precision default 0,
  add column if not exists margin double precision default 0,
  add column if not exists trend_data int4[] default '{}',
  add column if not exists saturation_score int4 default 0,
  add column if not exists competitors jsonb default '[]'::jsonb,
  add column if not exists ai_copy_variations jsonb default '{}'::jsonb;

update products
set
  name = coalesce(name, title, 'Untitled Product'),
  category = coalesce(category, 'General'),
  image_url = coalesce(image_url, ''),
  base_cost = coalesce(base_cost, cost_price, 0),
  market_price = coalesce(market_price, suggested_retail_price, 0),
  margin = coalesce(margin, profit_margin, 0),
  trend_data = coalesce(trend_data, array[60, 62, 64, 66, 68, 70]),
  saturation_score = coalesce(saturation_score, greatest(0, least(100, 100 - coalesce(win_rate_score, 60)))),
  competitors = coalesce(competitors, '[]'::jsonb),
  ai_copy_variations = coalesce(ai_copy_variations, '{}'::jsonb);
