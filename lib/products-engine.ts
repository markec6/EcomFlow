import type { Product } from "@/types/database"
import { getSupabaseClient } from "@/lib/supabase/client"

export type CompetitorProfile = {
  name: string
  price: number
  ad_video_url: string
  traffic_sources: {
    tiktok?: number
    fb?: number
    search?: number
    instagram?: number
    email?: number
  }
  top_products: { name: string; orders: number; price: number }[]
}

export type ProductRecord = Product & {
  competitors: CompetitorProfile[]
  ai_copy_variations: {
    emotional_hook: string
    professional_direct: string
  }
}

export const ACTIVE_PRODUCT_STORAGE_KEY = "ecomflow_active_product_id"

export const seedProducts: ProductRecord[] = [
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f101",
    name: "Portable Neck Massager Pro",
    category: "Wellness",
    image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&h=700&fit=crop",
    base_cost: 12.5,
    market_price: 49.99,
    margin: 24,
    trend_data: [65, 68, 72, 78, 82, 80, 88, 91],
    saturation_score: 74,
    competitors: [
      {
        name: "NovaCartel",
        price: 69,
        ad_video_url: "https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-video-for-her-social-media-41577-large.mp4",
        traffic_sources: { tiktok: 80, fb: 10, search: 10 },
        top_products: [
          { name: "Smart Recovery Gun", orders: 4120, price: 69 },
          { name: "Neck Massager Pro", orders: 3910, price: 64 },
        ],
      },
      {
        name: "UrbanPulse Hub",
        price: 31,
        ad_video_url: "https://assets.mixkit.co/videos/preview/mixkit-man-showing-a-smartphone-to-the-camera-41022-large.mp4",
        traffic_sources: { fb: 70, instagram: 20, email: 10 },
        top_products: [
          { name: "Neck Massager Lite", orders: 2510, price: 31 },
          { name: "Back Relief Strap", orders: 1890, price: 29 },
        ],
      },
    ],
    ai_copy_variations: {
      emotional_hook:
        "Long desk days are brutal on your neck. This massager gives instant relief in minutes and helps you feel human again by evening.",
      professional_direct:
        "Portable neck therapy device with multiple modes, rechargeable battery, and fast-shipping fulfillment from verified warehouses.",
    },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f102",
    name: "Smart Water Bottle Tracker",
    category: "Electronics",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&h=700&fit=crop",
    base_cost: 9.5,
    market_price: 34.99,
    margin: 16,
    trend_data: [52, 56, 60, 64, 70, 75, 79, 83, 87],
    saturation_score: 61,
    competitors: [],
    ai_copy_variations: {
      emotional_hook:
        "You don’t need more motivation - you need a system. This bottle nudges your hydration habit until feeling energized becomes effortless.",
      professional_direct:
        "Leak-proof smart bottle with LED reminders, app sync, and reliable 5-7 day shipping performance for scalable campaigns.",
    },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f103",
    name: "Orthopedic Memory Pillow",
    category: "Home",
    image_url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=900&h=700&fit=crop",
    base_cost: 11.25,
    market_price: 44.99,
    margin: 21,
    trend_data: [40, 44, 47, 52, 55, 60, 58, 62],
    saturation_score: 42,
    competitors: [],
    ai_copy_variations: {
      emotional_hook:
        "Wake up without neck pain and finally enjoy deep sleep again. This pillow turns bedtime into recovery time.",
      professional_direct:
        "Orthopedic memory foam pillow engineered for neck alignment, durable shape retention, and dependable last-mile shipping.",
    },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f104",
    name: "LED Galaxy Projector Light",
    category: "Home Decor",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=700&fit=crop",
    base_cost: 15,
    market_price: 59.99,
    margin: 28,
    trend_data: [48, 52, 50, 62, 68, 73, 76, 81],
    saturation_score: 58,
    competitors: [],
    ai_copy_variations: {
      emotional_hook:
        "Turn any room into a calm cosmic escape in seconds. Perfect for stress relief, date nights, and bedtime rituals.",
      professional_direct:
        "Multi-mode LED projector with strong brightness output, low return rate profile, and high-converting creative angles.",
    },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f105",
    name: "Flame Aroma Diffuser",
    category: "Home Decor",
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&h=700&fit=crop",
    base_cost: 8.2,
    market_price: 32.99,
    margin: 14.7,
    trend_data: [36, 38, 42, 45, 51, 55, 57],
    saturation_score: 49,
    competitors: [],
    ai_copy_variations: {
      emotional_hook:
        "Create a warm, cozy vibe instantly - this diffuser gives your space a premium ambience people notice right away.",
      professional_direct:
        "Compact diffuser with flame-effect LED, stable performance, and shipping-friendly packaging ideal for volume fulfillment.",
    },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f106",
    name: "Pet Hair Remover Roller",
    category: "Pets",
    image_url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900&h=700&fit=crop",
    base_cost: 5.6,
    market_price: 24.99,
    margin: 11.9,
    trend_data: [31, 34, 33, 39, 45, 49, 53],
    saturation_score: 34,
    competitors: [],
    ai_copy_variations: {
      emotional_hook:
        "Pet owners know the struggle - hair everywhere. This roller keeps your couch and clothes clean in under a minute.",
      professional_direct:
        "Reusable lint-removal roller with strong cost-to-price ratio, low defect rate, and broad evergreen demand.",
    },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f107",
    name: "Mini UV Sterilizer Wand",
    category: "Gadgets",
    image_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&h=700&fit=crop",
    base_cost: 7.8,
    market_price: 29.99,
    margin: 14.6,
    trend_data: [29, 31, 35, 37, 41, 39, 44],
    saturation_score: 46,
    competitors: [],
    ai_copy_variations: {
      emotional_hook:
        "Peace of mind on-the-go: sanitize frequently used surfaces in seconds wherever life takes you.",
      professional_direct:
        "Portable UV sterilizer with practical use-case messaging, margin-friendly pricing, and fulfillment-ready form factor.",
    },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f108",
    name: "Car Seat Gap Organizer",
    category: "Auto",
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=700&fit=crop",
    base_cost: 6.2,
    market_price: 24.99,
    margin: 12.4,
    trend_data: [34, 33, 37, 39, 43, 46, 48],
    saturation_score: 38,
    competitors: [],
    ai_copy_variations: {
      emotional_hook:
        "No more lost keys, cards, or snacks between seats. This organizer fixes one of the most annoying daily driving pain points.",
      professional_direct:
        "Practical auto accessory with low COGS, broad appeal, and proven impulse-buy conversion in short-form ads.",
    },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f109",
    name: "Posture Corrector 2.0",
    category: "Fitness",
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&h=700&fit=crop",
    base_cost: 8.99,
    market_price: 39.99,
    margin: 19.5,
    trend_data: [44, 47, 52, 56, 60, 63, 61, 67],
    saturation_score: 66,
    competitors: [],
    ai_copy_variations: {
      emotional_hook:
        "Stand taller, feel stronger, and stop ending the day with shoulder pain. Small habit, huge confidence shift.",
      professional_direct:
        "Adjustable posture support with clear ergonomic value proposition and high-intent health/fitness targeting angles.",
    },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f110",
    name: "Portable Blender Go",
    category: "Kitchen",
    image_url: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=900&h=700&fit=crop",
    base_cost: 13.2,
    market_price: 46.99,
    margin: 20.3,
    trend_data: [41, 45, 49, 55, 58, 62, 68],
    saturation_score: 52,
    competitors: [],
    ai_copy_variations: {
      emotional_hook:
        "Healthy routines get easier when your smoothie is ready anywhere - gym, office, or commute.",
      professional_direct:
        "USB-rechargeable portable blender with lifestyle utility, premium perceived value, and repeatable ad creative formats.",
    },
  },
]

export function normalizeProduct(record: ProductRecord) {
  return {
    id: record.id,
    title: record.name,
    category: record.category,
    image: record.image_url ?? "",
    winRateScore: Math.max(1, Math.min(100, Math.round(record.trend_data.slice(-3).reduce((a, b) => a + b, 0) / Math.max(1, record.trend_data.slice(-3).length)))),
    tags: [record.category, record.saturation_score > 60 ? "Trending" : "Stable"],
    cost: record.base_cost,
    srp: record.market_price,
    profit: record.margin,
  }
}

type FetchProductsOptions = {
  limit?: number
  includeCompetitors?: boolean
  includeAiCopyVariations?: boolean
}

const BASE_PRODUCT_COLUMNS = ["id", "name", "category", "image_url", "base_cost", "market_price", "margin", "trend_data", "saturation_score"] as const

export async function fetchProductsFromSupabase(options: FetchProductsOptions = {}) {
  const { limit, includeCompetitors = true, includeAiCopyVariations = true } = options
  const client = getSupabaseClient()
  if (!client) {
    const fallbackRows = seedProducts.map((product) => ({
      ...product,
      competitors: includeCompetitors ? product.competitors : [],
      ai_copy_variations: includeAiCopyVariations ? product.ai_copy_variations : { emotional_hook: "", professional_direct: "" },
    }))
    return typeof limit === "number" ? fallbackRows.slice(0, limit) : fallbackRows
  }

  const selectedColumns = [
    ...BASE_PRODUCT_COLUMNS,
    ...(includeCompetitors ? ["competitors"] : []),
    ...(includeAiCopyVariations ? ["ai_copy_variations"] : []),
  ].join(",")

  let query = client
    .from("products")
    .select(selectedColumns)

  if (typeof limit === "number") {
    query = query.limit(limit)
  }

  const { data, error } = await (query as PromiseLike<{ data: unknown[] | null; error: unknown }>)

  if (error || !data) {
    const fallbackRows = seedProducts.map((product) => ({
      ...product,
      competitors: includeCompetitors ? product.competitors : [],
      ai_copy_variations: includeAiCopyVariations ? product.ai_copy_variations : { emotional_hook: "", professional_direct: "" },
    }))
    return typeof limit === "number" ? fallbackRows.slice(0, limit) : fallbackRows
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>

  return rows.map((row) => ({
    ...row,
    competitors: includeCompetitors && Array.isArray(row.competitors) ? (row.competitors as CompetitorProfile[]) : [],
    ai_copy_variations:
      includeAiCopyVariations && typeof row.ai_copy_variations === "object" && row.ai_copy_variations
        ? (row.ai_copy_variations as { emotional_hook: string; professional_direct: string })
        : { emotional_hook: "", professional_direct: "" },
    trend_data: Array.isArray(row.trend_data) ? (row.trend_data as number[]) : [],
  })) as ProductRecord[]
}

type FetchProductByIdOptions = {
  includeCompetitors?: boolean
  includeAiCopyVariations?: boolean
}

export async function fetchProductByIdFromSupabase(productId: string, options: FetchProductByIdOptions = {}) {
  const { includeCompetitors = false, includeAiCopyVariations = true } = options
  const client = getSupabaseClient()

  if (!client) {
    const fallback = seedProducts.find((product) => product.id === productId) ?? null
    if (!fallback) return null
    return {
      ...fallback,
      competitors: includeCompetitors ? fallback.competitors : [],
      ai_copy_variations: includeAiCopyVariations ? fallback.ai_copy_variations : { emotional_hook: "", professional_direct: "" },
    }
  }

  const selectedColumns = [
    ...BASE_PRODUCT_COLUMNS,
    ...(includeCompetitors ? ["competitors"] : []),
    ...(includeAiCopyVariations ? ["ai_copy_variations"] : []),
  ].join(",")

  const query = client
    .from("products")
    .select(selectedColumns)
    .eq("id", productId)
    .maybeSingle()

  const { data, error } = await (query as PromiseLike<{ data: Record<string, unknown> | null; error: unknown }>)
  if (error || !data) {
    const fallback = seedProducts.find((product) => product.id === productId) ?? null
    if (!fallback) return null
    return {
      ...fallback,
      competitors: includeCompetitors ? fallback.competitors : [],
      ai_copy_variations: includeAiCopyVariations ? fallback.ai_copy_variations : { emotional_hook: "", professional_direct: "" },
    }
  }

  return {
    ...data,
    competitors: includeCompetitors && Array.isArray(data.competitors) ? (data.competitors as CompetitorProfile[]) : [],
    ai_copy_variations:
      includeAiCopyVariations && typeof data.ai_copy_variations === "object" && data.ai_copy_variations
        ? (data.ai_copy_variations as { emotional_hook: string; professional_direct: string })
        : { emotional_hook: "", professional_direct: "" },
    trend_data: Array.isArray(data.trend_data) ? (data.trend_data as number[]) : [],
  } as ProductRecord
}

export function setActiveProductId(productId: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACTIVE_PRODUCT_STORAGE_KEY, productId)
}

export function getActiveProductId() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ACTIVE_PRODUCT_STORAGE_KEY)
}
