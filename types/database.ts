export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PlanType = "FREE" | "PRO" | "ENTERPRISE" | "free" | "pro" | "enterprise"
export type TrendStatus = "Trending" | "Stable" | "Saturated"
export type IntelligenceEventType = "new_product" | "trend_spike" | "supplier_found" | "competitor_spike"
export type SavedProductStatus = "saved" | "pushed_to_shopify" | "archived"

export interface Profile {
  id: string
  email: string | null
  username: string | null
  full_name: string | null
  avatar_url: string | null
  public_bio: string | null
  theme_preference: "dark" | "light" | null
  dark_mode: boolean | null
  email_alerts: boolean | null
  public_profile: boolean | null
  birth_date: string | null
  plan_type: PlanType
  ai_credits_remaining: number
  total_credits_used: number
  credits?: number
  shopify_store_url: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: string
  image_url: string | null
  base_cost: number
  market_price: number
  margin: number
  trend_data: number[]
  saturation_score: number
  competitors: Json
  ai_copy_variations: Json
  // legacy optional fields used by existing UI
  title?: string
  cost_price?: number | null
  suggested_retail_price?: number | null
  profit_margin?: number | null
  win_rate_score?: number | null
  tags?: string[] | null
  ai_target_audience?: Json | null
  source_url?: string | null
  created_at?: string
}

export interface MarketTrend {
  id: string
  niche_name: string
  growth_percentage: number | null
  country_code: string | null
  intensity_level: number | null
  last_updated: string
}

export interface AiIntelligenceFeedItem {
  id: string
  event_type: IntelligenceEventType | null
  message: string
  relevance_score: number | null
  metadata: Json | null
  created_at: string
}

export interface SavedProduct {
  id: string
  user_id: string | null
  product_id: string | null
  status: SavedProductStatus
  created_at: string
}

export interface VaultRecord {
  id: string
  user_id: string
  product_id: string
  name: string
  category: string | null
  cost: number
  srp: number
  created_at: string
}

export interface CreditSpendEvent {
  id: string
  user_id: string
  product_id: string
  action_type: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Omit<Profile, "id" | "created_at">> & { id: string }
        Update: Partial<Omit<Profile, "id">>
      }
      products: {
        Row: Product
        Insert: Partial<Omit<Product, "id" | "created_at">>
        Update: Partial<Omit<Product, "id">>
      }
      market_trends: {
        Row: MarketTrend
        Insert: Partial<Omit<MarketTrend, "id" | "last_updated">> & Pick<MarketTrend, "niche_name">
        Update: Partial<Omit<MarketTrend, "id">>
      }
      ai_intelligence_feed: {
        Row: AiIntelligenceFeedItem
        Insert: Partial<Omit<AiIntelligenceFeedItem, "id" | "created_at">> & Pick<AiIntelligenceFeedItem, "message">
        Update: Partial<Omit<AiIntelligenceFeedItem, "id">>
      }
      saved_products: {
        Row: SavedProduct
        Insert: Partial<Omit<SavedProduct, "id" | "created_at">>
        Update: Partial<Omit<SavedProduct, "id">>
      }
      vault: {
        Row: VaultRecord
        Insert: Partial<Omit<VaultRecord, "id" | "created_at">>
        Update: Partial<Omit<VaultRecord, "id">>
      }
      credit_spend_events: {
        Row: CreditSpendEvent
        Insert: Partial<Omit<CreditSpendEvent, "id" | "created_at">>
        Update: Partial<Omit<CreditSpendEvent, "id">>
      }
    }
  }
}
