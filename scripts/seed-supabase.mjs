import { createClient } from "@supabase/supabase-js"

const url = "https://ujsxwzjejxhawjxtupwu.supabase.co"
const anon = "sb_publishable_Y12yxCV86CZ6e2g4sdVeAQ_-wF6vh4o"

if (!url || !anon) {
  console.error("Missing Supabase env vars.")
  process.exit(1)
}

const supabase = createClient(url, anon)

const products = [
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f101",
    name: "Portable Neck Massager Pro",
    category: "Wellness",
    image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&h=700&fit=crop",
    base_cost: 12.5, market_price: 49.99, margin: 24, trend_data: [65, 68, 72, 78, 82, 80, 88, 91], saturation_score: 74,
    competitors: [{ name: "NovaCartel", price: 69, ad_video_url: "https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-video-for-her-social-media-41577-large.mp4", traffic_sources: { tiktok: 80, fb: 10, search: 10 }, top_products: [{ name: "Smart Recovery Gun", orders: 4120, price: 69 }] }],
    ai_copy_variations: { emotional_hook: "Long desk days are brutal on your neck. This massager gives instant relief in minutes.", professional_direct: "Portable neck therapy device with multiple modes and fulfillment-ready logistics." },
  },
  {
    id: "f8c58f08-54f6-4efe-9575-95e0a2e6f102",
    name: "Smart Water Bottle Tracker",
    category: "Electronics",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&h=700&fit=crop",
    base_cost: 9.5, market_price: 34.99, margin: 16, trend_data: [52, 56, 60, 64, 70, 75, 79, 83, 94], saturation_score: 61,
    competitors: [{ name: "NovaHausStore", price: 47, ad_video_url: "https://assets.mixkit.co/videos/preview/mixkit-man-showing-a-smartphone-to-the-camera-41022-large.mp4", traffic_sources: { tiktok: 74, fb: 16, search: 10 }, top_products: [{ name: "Hydration Tracker Bottle", orders: 3670, price: 47 }] }],
    ai_copy_variations: { emotional_hook: "You deserve energy all day. This smart bottle quietly keeps your hydration on track...", professional_direct: "Leak-proof smart bottle with LED reminders, app sync, and reliable 5-7 day shipping performance." },
  },
  { id: "f8c58f08-54f6-4efe-9575-95e0a2e6f103", name: "Orthopedic Sleep Pillow", category: "Home", image_url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=900&h=700&fit=crop", base_cost: 11.25, market_price: 44.99, margin: 21, trend_data: [40, 44, 47, 52, 55, 60, 58, 62], saturation_score: 42, competitors: [], ai_copy_variations: { emotional_hook: "Wake up without neck pain and finally enjoy deep sleep again.", professional_direct: "Orthopedic memory foam support engineered for neck alignment and sleep quality." } },
  { id: "f8c58f08-54f6-4efe-9575-95e0a2e6f104", name: "LED Galaxy Projector Light", category: "Home Decor", image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=700&fit=crop", base_cost: 15, market_price: 59.99, margin: 28, trend_data: [48, 52, 50, 62, 68, 73, 76, 81], saturation_score: 58, competitors: [], ai_copy_variations: { emotional_hook: "Turn any room into a calm cosmic escape in seconds.", professional_direct: "High-converting decor product with premium perceived value and stable fulfillment." } },
  { id: "f8c58f08-54f6-4efe-9575-95e0a2e6f105", name: "Flame Aroma Diffuser", category: "Home Decor", image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&h=700&fit=crop", base_cost: 8.2, market_price: 32.99, margin: 14.7, trend_data: [36, 38, 42, 45, 51, 55, 57], saturation_score: 49, competitors: [], ai_copy_variations: { emotional_hook: "Create a warm, cozy vibe instantly.", professional_direct: "Compact diffuser with flame-effect LED and shipping-friendly packaging." } },
  { id: "f8c58f08-54f6-4efe-9575-95e0a2e6f106", name: "Pet Hair Remover Roller", category: "Pets", image_url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900&h=700&fit=crop", base_cost: 5.6, market_price: 24.99, margin: 11.9, trend_data: [31, 34, 33, 39, 45, 49, 53], saturation_score: 34, competitors: [], ai_copy_variations: { emotional_hook: "Pet owners know the struggle - hair everywhere.", professional_direct: "Reusable lint-removal roller with broad evergreen demand." } },
  { id: "f8c58f08-54f6-4efe-9575-95e0a2e6f107", name: "Mini UV Sterilizer Wand", category: "Gadgets", image_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&h=700&fit=crop", base_cost: 7.8, market_price: 29.99, margin: 14.6, trend_data: [29, 31, 35, 37, 41, 39, 44], saturation_score: 46, competitors: [], ai_copy_variations: { emotional_hook: "Peace of mind on-the-go: sanitize surfaces in seconds.", professional_direct: "Portable UV sterilizer with margin-friendly pricing and practical utility." } },
  { id: "f8c58f08-54f6-4efe-9575-95e0a2e6f108", name: "Car Seat Gap Organizer", category: "Auto", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=700&fit=crop", base_cost: 6.2, market_price: 24.99, margin: 12.4, trend_data: [34, 33, 37, 39, 43, 46, 48], saturation_score: 38, competitors: [], ai_copy_variations: { emotional_hook: "No more lost keys between seats.", professional_direct: "Practical auto accessory with low COGS and repeat-purchase angle." } },
  { id: "f8c58f08-54f6-4efe-9575-95e0a2e6f109", name: "Posture Corrector 2.0", category: "Fitness", image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&h=700&fit=crop", base_cost: 8.99, market_price: 39.99, margin: 19.5, trend_data: [44, 47, 52, 56, 60, 63, 61, 67], saturation_score: 66, competitors: [], ai_copy_variations: { emotional_hook: "Stand taller, feel stronger, and stop daily shoulder pain.", professional_direct: "Adjustable posture support with clear ergonomic value proposition." } },
  { id: "f8c58f08-54f6-4efe-9575-95e0a2e6f110", name: "Portable Blender Go", category: "Kitchen", image_url: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=900&h=700&fit=crop", base_cost: 13.2, market_price: 46.99, margin: 20.3, trend_data: [41, 45, 49, 55, 58, 62, 68], saturation_score: 52, competitors: [], ai_copy_variations: { emotional_hook: "Healthy routines get easier when your smoothie is ready anywhere.", professional_direct: "USB-rechargeable portable blender with premium perceived value." } },
]

const { error } = await supabase.from("products").upsert(products, { onConflict: "id" })
if (error) {
  console.error(error)
  process.exit(1)
}

console.log(`Seeded ${products.length} products successfully.`)
