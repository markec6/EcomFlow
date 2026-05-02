"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import useSWR from "swr"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { fetchProductByIdFromSupabase, seedProducts } from "@/lib/products-engine"
import { BarChart3, Copy, Info } from "lucide-react"
import { toast } from "sonner"
import { useProducts } from "@/hooks/use-products"

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1511497584788-876760111969?w=1200&h=900&fit=crop"

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>()
  const productId = String(params.id ?? "")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeImage, setActiveImage] = useState(0)
  const [units, setUnits] = useState(100)
  const { products: cachedProducts } = useProducts({
    limit: 24,
    includeCompetitors: false,
    includeAiCopyVariations: true,
  })
  const cachedProduct = useMemo(
    () => cachedProducts.find((item) => item.id === productId) ?? seedProducts.find((item) => item.id === productId) ?? null,
    [cachedProducts, productId]
  )
  const { data: product, isLoading } = useSWR(
    productId ? ["product-detail", productId] : null,
    () =>
      fetchProductByIdFromSupabase(productId, {
        includeCompetitors: false,
        includeAiCopyVariations: true,
      }),
    {
      fallbackData: cachedProduct,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
      keepPreviousData: true,
    }
  )

  const gallery = useMemo(() => {
    const primary = product?.image_url ?? FALLBACK_IMAGE
    return [primary, primary, primary]
  }, [product?.image_url])

  const specs = useMemo(() => {
    if (!product) return []
    if (product.category.toLowerCase().includes("wellness")) {
      return ["Battery Life: Up to 120 minutes", "Modes: 6 intensity levels", "Material: Skin-safe ABS + silicone contact pads"]
    }
    if (product.category.toLowerCase().includes("home")) {
      return ["Material: Breathable premium blend", "Dimensions: 50 x 30 x 12 cm", "Care: Easy clean, low-maintenance finish"]
    }
    return ["Performance: Built for daily use", "Design: Compact and mobile-first selling angle", "Reliability: Fulfillment-ready structure"]
  }, [product])

  const marginPerUnit = (product?.market_price ?? 0) - (product?.base_cost ?? 0)
  const projectedMargin = marginPerUnit * units

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="relative z-10 pl-[var(--content-offset,0px)] pt-16 transition-[padding] duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          {isLoading ? (
            <div className="h-[420px] rounded-xl glass-panel border border-primary/20 animate-pulse" />
          ) : product ? (
            <div className="space-y-6">
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 glass-panel rounded-xl border border-primary/20 p-5">
                <div>
                  <div className="relative h-[420px] rounded-xl overflow-hidden border border-primary/20">
                    <Image src={gallery[activeImage] ?? FALLBACK_IMAGE} alt={product.name} fill className="object-cover" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {gallery.map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        onClick={() => setActiveImage(idx)}
                        className={`relative h-20 rounded-lg overflow-hidden border ${activeImage === idx ? "border-primary" : "border-primary/20"}`}
                      >
                        <Image src={src} alt={`${product.name} view ${idx + 1}`} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <span className="inline-flex px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary">
                    {product.category}
                  </span>
                  <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
                  <div className="glass-panel rounded-xl border border-primary/20 p-4 space-y-1.5">
                    <p className="text-sm text-muted-foreground">Live Market Price</p>
                    <p className="text-2xl font-bold text-emerald-400">${product.market_price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Base Cost: <span className="text-foreground font-semibold">${product.base_cost.toFixed(2)}</span></p>
                  </div>
                  <div className="glass-panel rounded-xl border border-primary/20 p-4">
                    <p className="text-xs text-muted-foreground">Market Momentum</p>
                    <div className="mt-2 flex items-center gap-2 text-primary">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm font-medium">Saturation Score: {product.saturation_score}/100</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {[
                  { key: "emotional_hook", title: "Emotional Hook" },
                  { key: "professional_direct", title: "Professional Direct" },
                ].map((block) => {
                  const copy = (product.ai_copy_variations as Record<string, string>)[block.key] ?? "No copy available."
                  return (
                    <div key={block.key} className="glass-panel rounded-xl border border-primary/20 p-4">
                      <p className="text-xs text-muted-foreground">{block.title}</p>
                      <blockquote className="mt-2 text-sm text-foreground border-l-2 border-primary/50 pl-3">
                        {copy}
                      </blockquote>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(copy)
                          toast.success(`${block.title} copied`)
                        }}
                        className="mt-3 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs inline-flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy to Clipboard
                      </button>
                    </div>
                  )
                })}
              </section>

              <section className="glass-panel rounded-xl border border-primary/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Specs & Description</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {product.name} is positioned in {product.category} with performance-focused messaging for premium conversion campaigns and fast validation loops.
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  {specs.map((line) => (
                    <li key={line} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      {line}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="glass-panel rounded-xl border border-primary/20 p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">Profitability Calculator</h2>
                <p className="text-sm text-muted-foreground">(Market Price - Base Cost) x Units</p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={1000}
                    value={units}
                    onChange={(event) => setUnits(Number(event.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-foreground w-16 text-right">{units}</span>
                </div>
                <p className="mt-3 text-primary font-semibold">
                  (${product.market_price.toFixed(2)} - ${product.base_cost.toFixed(2)}) x {units} = ${projectedMargin.toFixed(2)}
                </p>
              </section>
            </div>
          ) : (
            <p className="text-muted-foreground">Product not found.</p>
          )}
        </div>
      </main>
    </div>
  )
}
