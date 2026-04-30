insert into products (id, name, category, image_url, base_cost, market_price, margin, trend_data, saturation_score, competitors, ai_copy_variations)
values
(
  'f8c58f08-54f6-4efe-9575-95e0a2e6f101',
  'Portable Neck Massager Pro',
  'Wellness',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&h=700&fit=crop',
  12.5, 49.99, 24.0, '{65,68,72,78,82,80,88,91}', 74,
  '[
    {"name":"NovaCartel","price":69,"ad_video_url":"https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-video-for-her-social-media-41577-large.mp4","traffic_sources":{"tiktok":80,"fb":10,"search":10},"top_products":[{"name":"Smart Recovery Gun","orders":4120,"price":69},{"name":"Neck Massager Pro","orders":3910,"price":64}]},
    {"name":"UrbanPulse Hub","price":31,"ad_video_url":"https://assets.mixkit.co/videos/preview/mixkit-man-showing-a-smartphone-to-the-camera-41022-large.mp4","traffic_sources":{"fb":70,"instagram":20,"email":10},"top_products":[{"name":"Neck Massager Lite","orders":2510,"price":31},{"name":"Back Relief Strap","orders":1890,"price":29}]}
  ]'::jsonb,
  '{"emotional_hook":"Long desk days are brutal on your neck. This massager gives instant relief in minutes and helps you feel human again by evening.","professional_direct":"Portable neck therapy device with multiple modes, rechargeable battery, and fast-shipping fulfillment from verified warehouses."}'::jsonb
),
('f8c58f08-54f6-4efe-9575-95e0a2e6f102','Smart Water Bottle Tracker','Electronics','https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&h=700&fit=crop',9.5,34.99,16.0,'{52,56,60,64,70,75,79,83,87}',61,'[]'::jsonb,'{"emotional_hook":"You don’t need more motivation - you need a system. This bottle nudges your hydration habit until feeling energized becomes effortless.","professional_direct":"Leak-proof smart bottle with LED reminders, app sync, and reliable 5-7 day shipping performance for scalable campaigns."}'::jsonb),
('f8c58f08-54f6-4efe-9575-95e0a2e6f103','Orthopedic Memory Pillow','Home','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=900&h=700&fit=crop',11.25,44.99,21.0,'{40,44,47,52,55,60,58,62}',42,'[]'::jsonb,'{"emotional_hook":"Wake up without neck pain and finally enjoy deep sleep again. This pillow turns bedtime into recovery time.","professional_direct":"Orthopedic memory foam pillow engineered for neck alignment, durable shape retention, and dependable last-mile shipping."}'::jsonb),
('f8c58f08-54f6-4efe-9575-95e0a2e6f104','LED Galaxy Projector Light','Home Decor','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=700&fit=crop',15.0,59.99,28.0,'{48,52,50,62,68,73,76,81}',58,'[]'::jsonb,'{"emotional_hook":"Turn any room into a calm cosmic escape in seconds. Perfect for stress relief, date nights, and bedtime rituals.","professional_direct":"Multi-mode LED projector with strong brightness output, low return rate profile, and high-converting creative angles."}'::jsonb),
('f8c58f08-54f6-4efe-9575-95e0a2e6f105','Flame Aroma Diffuser','Home Decor','https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&h=700&fit=crop',8.2,32.99,14.7,'{36,38,42,45,51,55,57}',49,'[]'::jsonb,'{"emotional_hook":"Create a warm, cozy vibe instantly - this diffuser gives your space a premium ambience people notice right away.","professional_direct":"Compact diffuser with flame-effect LED, stable performance, and shipping-friendly packaging ideal for volume fulfillment."}'::jsonb),
('f8c58f08-54f6-4efe-9575-95e0a2e6f106','Pet Hair Remover Roller','Pets','https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900&h=700&fit=crop',5.6,24.99,11.9,'{31,34,33,39,45,49,53}',34,'[]'::jsonb,'{"emotional_hook":"Pet owners know the struggle - hair everywhere. This roller keeps your couch and clothes clean in under a minute.","professional_direct":"Reusable lint-removal roller with strong cost-to-price ratio, low defect rate, and broad evergreen demand."}'::jsonb),
('f8c58f08-54f6-4efe-9575-95e0a2e6f107','Mini UV Sterilizer Wand','Gadgets','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&h=700&fit=crop',7.8,29.99,14.6,'{29,31,35,37,41,39,44}',46,'[]'::jsonb,'{"emotional_hook":"Peace of mind on-the-go: sanitize frequently used surfaces in seconds wherever life takes you.","professional_direct":"Portable UV sterilizer with practical use-case messaging, margin-friendly pricing, and fulfillment-ready form factor."}'::jsonb),
('f8c58f08-54f6-4efe-9575-95e0a2e6f108','Car Seat Gap Organizer','Auto','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=700&fit=crop',6.2,24.99,12.4,'{34,33,37,39,43,46,48}',38,'[]'::jsonb,'{"emotional_hook":"No more lost keys, cards, or snacks between seats. This organizer fixes one of the most annoying daily driving pain points.","professional_direct":"Practical auto accessory with low COGS, broad appeal, and proven impulse-buy conversion in short-form ads."}'::jsonb),
('f8c58f08-54f6-4efe-9575-95e0a2e6f109','Posture Corrector 2.0','Fitness','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&h=700&fit=crop',8.99,39.99,19.5,'{44,47,52,56,60,63,61,67}',66,'[]'::jsonb,'{"emotional_hook":"Stand taller, feel stronger, and stop ending the day with shoulder pain. Small habit, huge confidence shift.","professional_direct":"Adjustable posture support with clear ergonomic value proposition and high-intent health/fitness targeting angles."}'::jsonb),
('f8c58f08-54f6-4efe-9575-95e0a2e6f110','Portable Blender Go','Kitchen','https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=900&h=700&fit=crop',13.2,46.99,20.3,'{41,45,49,55,58,62,68}',52,'[]'::jsonb,'{"emotional_hook":"Healthy routines get easier when your smoothie is ready anywhere - gym, office, or commute.","professional_direct":"USB-rechargeable portable blender with lifestyle utility, premium perceived value, and repeatable ad creative formats."}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  image_url = excluded.image_url,
  base_cost = excluded.base_cost,
  market_price = excluded.market_price,
  margin = excluded.margin,
  trend_data = excluded.trend_data,
  saturation_score = excluded.saturation_score,
  competitors = excluded.competitors,
  ai_copy_variations = excluded.ai_copy_variations;
