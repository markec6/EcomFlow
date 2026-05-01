# EcomFlow Database Schema (Supabase)

This document mirrors the live database schema and maps each table to dashboard UI sections.

## Tables

### `profiles`
- Purpose: user identity, subscription, and AI credit guardrail
- Key UI usage:
  - `id` -> same value as Clerk `user.id`
  - `plan_type`, `ai_credits_remaining`, `total_credits_used` -> plan badge and AI usage
  - `shopify_store_url` -> Shopify Sync setup

### `products`
- Purpose: Product Discovery source of truth
- Key UI usage:
  - `title`, `image_url`, `category`, `tags` -> discovery cards and top search
  - `cost_price`, `suggested_retail_price`, `profit_margin`, `win_rate_score` -> product metrics and score badge
  - `ai_ad_copy`, `ai_target_audience` -> AI Intelligence panel output

### `market_trends`
- Purpose: trend signals for Market Heatmap
- Key UI usage:
  - `niche_name`, `growth_percentage`, `country_code`, `intensity_level`

### `ai_intelligence_feed`
- Purpose: live right-sidebar event stream
- Key UI usage:
  - `event_type`, `message`, `relevance_score`, `metadata`

### `saved_products`
- Purpose: user-level product vault and push pipeline
- Key UI usage:
  - `status` -> `saved`, `pushed_to_shopify`, `archived`
  - unique `(user_id, product_id)` to prevent duplicates

## Search Bar Notes

Top search should query `products` by:
- `title`
- `category`
- `tags` array

Planned SQL shape:
- `title ILIKE %query% OR category ILIKE %query% OR tags && ARRAY[query]`

## AI Credits Guardrail

Before generating new analysis:
1. Read `profiles.ai_credits_remaining`
2. If `<= 0`, block action and show upgrade path
3. If `> 0`, decrement credits and run analysis

## RLS Constraints (Required)

Users must only access their own rows for:
- `profiles`: `id = Clerk user id`
- `saved_products`: `user_id = profiles.id`
