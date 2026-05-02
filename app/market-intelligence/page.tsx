"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LazyHeader, LazySidebar } from "@/components/dashboard/lazy-shell"
import type { Product, SavedProduct } from "@/types/database"
import { Check, Loader2 } from "lucide-react"
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts"
import { fetchProductsFromSupabase } from "@/lib/products-engine"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAiCredits } from "@/hooks/use-ai-credits"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { spendCreditForProductScan } from "@/lib/credit-transactions"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"

const productCountryMap: Record<string, string> = {}
const STATIC_TS = "2026-04-28T12:00:00.000Z"
const trackedCountryDots = [{ code: "US", x: 72, y: 64 }, { code: "CA", x: 62, y: 50 }, { code: "UK", x: 144, y: 50 }, { code: "DE", x: 157, y: 54 }, { code: "FR", x: 151, y: 59 }, { code: "AU", x: 256, y: 108 }]
const pulseClassByIntensity = (intensity: number | null) => (!intensity || intensity <= 2 ? "bg-cyan-400" : intensity === 3 ? "bg-violet-400" : intensity === 4 ? "bg-fuchsia-400" : "bg-rose-400")

export default function MarketIntelligencePage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [searchQuery, setSearchQuery] = useState("")
  const { setCredits, decrementCredit, userId: activeUserId } = useAiCredits()
  const [products, setProducts] = useState<Product[]>([])
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [recentlySavedProductId, setRecentlySavedProductId] = useState<string | null>(null)
  const [scanningProducts, setScanningProducts] = useState<Record<string, boolean>>({})
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showGuestLock, setShowGuestLock] = useState(false)
  const query = searchQuery.trim().toLowerCase()
  const activeCountry = hoveredCountry ?? selectedCountry

  useEffect(() => {
    if (!recentlySavedProductId) return
    const timer = setTimeout(() => setRecentlySavedProductId(null), 900)
    return () => clearTimeout(timer)
  }, [recentlySavedProductId])

  useEffect(() => {
    fetchProductsFromSupabase().then((rows) => {
      setProducts(rows)
      rows.forEach((row, idx) => {
        productCountryMap[row.id] = ["US", "UK", "CA", "AU", "DE", "FR"][idx % 6]
      })
    })
  }, [])

  const searchFilteredProducts = useMemo(() => {
    if (!query) return products
    return products.filter((product) => (product.name ?? "").toLowerCase().includes(query) || (product.category ?? "").toLowerCase().includes(query))
  }, [products, query])
  const countryFilteredProducts = useMemo(() => (!selectedCountry ? searchFilteredProducts : searchFilteredProducts.filter((product) => productCountryMap[product.id] === selectedCountry)), [searchFilteredProducts, selectedCountry])
  const filteredTrends = useMemo(() => {
    let trends = products.map((product) => ({
      id: product.id,
      niche_name: product.name,
      growth_percentage: Number(((product.trend_data.at(-1) ?? 0) - (product.trend_data[0] ?? 0)).toFixed(1)),
      country_code: productCountryMap[product.id] ?? "US",
      intensity_level: Math.max(1, Math.min(5, Math.round((product.saturation_score ?? 0) / 20))),
    }))
    if (selectedCountry) trends = trends.filter((trend) => trend.country_code === selectedCountry)
    if (!query) return trends
    return trends.filter((trend) => `${trend.country_code ?? ""} ${trend.niche_name}`.toLowerCase().includes(query))
  }, [products, query, selectedCountry])
  const competitorFeed = useMemo(() => {
    let feed = products.flatMap((product) =>
      (Array.isArray(product.competitors) ? product.competitors : []).map((competitor, idx) => ({
        id: `${product.id}-${idx}`,
        message: `${competitor.name} pushing ${product.name}`,
        metadata: {
          store_name: competitor.name,
          detected_product: product.name,
          ad_spend_est: `$${(Number(competitor.price ?? 0) * 180).toFixed(0)}/week`,
          country_code: productCountryMap[product.id] ?? "US",
        },
      }))
    )
    if (selectedCountry) feed = feed.filter((item) => (item.metadata as { country_code?: string } | null)?.country_code === selectedCountry)
    if (!query) return feed
    return feed.filter((item) => item.message.toLowerCase().includes(query) || JSON.stringify(item.metadata ?? {}).toLowerCase().includes(query))
  }, [products, query, selectedCountry])
  const winRateAreaData = useMemo(() => {
    const maxLen = Math.max(0, ...countryFilteredProducts.map((item) => item.trend_data?.length ?? 0))
    return Array.from({ length: maxLen }, (_, index) => {
      const points = countryFilteredProducts.map((item) => item.trend_data?.[index]).filter((v): v is number => typeof v === "number")
      const avg = points.length ? points.reduce((a, b) => a + b, 0) / points.length : 0
      return { day: index + 1, score: Math.round(avg) }
    })
  }, [countryFilteredProducts])
  const categorySaturationData = useMemo(() => {
    const map = new Map<string, { count: number; totalProfit: number }>()
    countryFilteredProducts.forEach((product) => {
      const category = product.category ?? "Unknown"
      const entry = map.get(category) ?? { count: 0, totalProfit: 0 }
      entry.count += 1
      entry.totalProfit += product.margin ?? 0
      map.set(category, entry)
    })
    return Array.from(map.entries()).map(([category, values]) => ({ category, count: values.count, avgProfit: Number((values.totalProfit / values.count).toFixed(1)) }))
  }, [countryFilteredProducts])
  const opportunityRows = useMemo(() => countryFilteredProducts.map((product) => ({ product, predictedProfit: (product.market_price ?? 0) - (product.base_cost ?? 0), saturationScore: Math.max(1, Math.min(100, product.saturation_score ?? 0)) })), [countryFilteredProducts])

  const handleSaveToVault = async (product: Product) => {
    if (savedProducts.some((item) => item.product_id === product.id)) {
      toast.info("This product is already in your vault.")
      return
    }
    const client = getSupabaseClient()
    if (client && activeUserId) {
      const { error } = await client.from("vault").insert({
        user_id: activeUserId,
        product_id: product.id,
        name: product.name,
        category: product.category,
        cost: product.base_cost,
        srp: product.market_price,
      })
      if (error?.message?.toLowerCase().includes("duplicate") || error?.message?.toLowerCase().includes("unique")) {
        toast.info("This product is already in your vault.")
        return
      }
      await client.from("saved_products").insert({ user_id: activeUserId, product_id: product.id, status: "saved" })
    }
    setSavedProducts((current) => [...current, { id: crypto.randomUUID(), user_id: activeUserId ?? "demo-user", product_id: product.id, status: "saved", created_at: STATIC_TS }])
    setRecentlySavedProductId(product.id)
    toast.success("Product secured in your Vault!")
  }

  const handleDeepResearch = async (product: Product) => {
    const productId = String(product.id ?? "")
    if (!productId) {
      toast.error("Product ID is missing.")
      return
    }
    if (scanningProducts[productId] || isRedirecting) return
    setScanningProducts((current) => ({ ...current, [productId]: true }))
    if (!product?.id) {
      toast.error("Product ID is missing.")
      setScanningProducts((current) => ({ ...current, [productId]: false }))
      return
    }
    const client = getSupabaseClient()

    if (!activeUserId) {
      const creditSpent = await decrementCredit()
      if (!creditSpent) {
        setScanningProducts((current) => ({ ...current, [productId]: false }))
        setShowGuestLock(true)
        return
      }
      toast.success("Guest deep research started.")
      setIsRedirecting(true)
      window.location.href = `/products/${productId}`
      return
    }

    const result = await spendCreditForProductScan(client, activeUserId, productId)
    if (!result.ok) {
      if (result.reason === "duplicate") {
        toast.info("Research already started. Please wait a moment.")
      } else if (result.reason === "insufficient_credits") {
        toast.error("Insufficient credits.")
      } else {
        toast.error("Could not start research. Please try again.")
      }
      setScanningProducts((current) => ({ ...current, [productId]: false }))
      return
    }

    void setCredits(result.remainingCredits)
    toast.success("Analyzing product... 1 credit used.")
    setIsRedirecting(true)
    window.location.href = `/products/${productId}`
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <LazySidebar />
      <LazyHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="relative z-10 pl-[var(--content-offset,0px)] pt-16 transition-[padding] duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Market Intelligence War Room</h1>
            <p className="text-sm text-muted-foreground mt-1">Live demand mapping, category pressure, and opportunity scoring for high-velocity decisions.</p>
          </motion.div>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <div className="analytics-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Global Demand Heatmap</h2>
                <button onClick={() => setSelectedCountry(null)} className="px-3 py-1.5 min-h-11 rounded-lg border border-primary/30 text-xs text-primary hover:bg-primary hover:text-white transition-colors duration-200 touch-manipulation">Clear Filter</button>
              </div>
              <div className="analytics-subpanel rounded-xl p-3 mb-4 transform-gpu">
                <svg viewBox="0 0 320 140" className="w-full h-[120px]">
                  <path d="M15 58L38 46L60 51L74 58L80 71L96 75L109 69L125 74L132 64L144 66L158 55L170 59L176 71L189 76L205 72L220 76L236 85L249 95L261 102L273 98L290 104L302 95" stroke="rgba(148,163,184,0.35)" strokeWidth="2.5" fill="none" />
                  {trackedCountryDots.map((dot) => {
                    const isActive = activeCountry === dot.code
                    return (
                      <g key={dot.code}>
                        <motion.circle cx={dot.x} cy={dot.y} r={isActive ? 6.5 : 4} fill="rgba(139,92,246,0.9)" animate={{ opacity: isActive ? [0.8, 1, 0.8] : [0.45, 0.72, 0.45], scale: isActive ? [1, 1.14, 1] : [1, 1.04, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                        <motion.circle cx={dot.x} cy={dot.y} r={isActive ? 14 : 9} fill="rgba(139,92,246,0.15)" animate={{ opacity: isActive ? [0.25, 0.55, 0.25] : [0.1, 0.22, 0.1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                      </g>
                    )
                  })}
                </svg>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTrends.map((trend) => (
                    <motion.div key={trend.id} whileHover={isMobile ? undefined : { scale: 1.02, boxShadow: "0 14px 28px rgba(2, 6, 23, 0.35)" }} transition={{ duration: 0.2 }} onMouseEnter={isMobile ? undefined : () => setHoveredCountry(trend.country_code ?? null)} onMouseLeave={isMobile ? undefined : () => setHoveredCountry(null)} onClick={() => setSelectedCountry((current) => (current === trend.country_code ? null : trend.country_code ?? null))} className={`analytics-subpanel rounded-xl p-4 cursor-pointer transform-gpu touch-manipulation ${selectedCountry === trend.country_code ? "border-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-foreground">{trend.country_code}</p>
                      <motion.span className={`w-2.5 h-2.5 rounded-full ${pulseClassByIntensity(trend.intensity_level)}`} animate={{ scale: [1, 1.3, 1], opacity: [0.45, 1, 0.45] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                    </div>
                    <p className="text-sm text-muted-foreground">{trend.niche_name}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">+{trend.growth_percentage?.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Intensity {trend.intensity_level}/5</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <AnimatePresence mode="wait">
            <motion.section key={selectedCountry ?? "GLOBAL"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
              <div className="analytics-panel rounded-xl p-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">Market Win-Rate Trend (30 Days)</h2>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={winRateAreaData}>
                      <defs><linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.6} /><stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.04} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.12)" />
                      <XAxis dataKey="day" stroke="#a1a1aa" tickLine={false} axisLine={false} tickFormatter={(value: number) => (value % 4 === 1 ? `D${value}` : "")} />
                      <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} domain={[50, 100]} />
                      <Tooltip contentStyle={{ background: "#0f1020", border: "1px solid rgba(139, 92, 246, 0.24)", borderRadius: "0.75rem" }} />
                      <Area type="monotone" dataKey="score" stroke="#A78BFA" strokeWidth={2.5} fill="url(#winRateGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="analytics-panel rounded-xl p-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">Category Saturation Index</h2>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categorySaturationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.12)" />
                      <XAxis dataKey="category" stroke="#a1a1aa" tickLine={false} axisLine={false} />
                      <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#0f1020", border: "1px solid rgba(139, 92, 246, 0.24)", borderRadius: "0.75rem" }} />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="avgProfit" fill="#22C55E" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.section>
          </AnimatePresence>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <div className="analytics-panel rounded-xl p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">Competitor Live Spying</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {competitorFeed.map((item) => {
                  const storeName = (item.metadata as { store_name?: string } | null)?.store_name ?? "Unknown Store"
                  const detectedProduct = (item.metadata as { detected_product?: string } | null)?.detected_product ?? "Unknown Product"
                  const spend = (item.metadata as { ad_spend_est?: string } | null)?.ad_spend_est ?? "N/A"
                  return (
                    <motion.div key={item.id} whileHover={isMobile ? undefined : { scale: 1.02, boxShadow: "0 14px 28px rgba(2, 6, 23, 0.35)" }} transition={{ duration: 0.2 }} className="analytics-subpanel min-w-[280px] rounded-xl px-4 py-3 transform-gpu">
                      <div className="flex items-center gap-2 mb-2">
                        <motion.span className="w-2 h-2 rounded-full bg-rose-400" animate={{ scale: [1, 1.3, 1], opacity: [0.45, 1, 0.45] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                        <span className="text-[11px] uppercase tracking-wide text-rose-300 font-semibold">Live</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{storeName}</p>
                      <p className="text-xs text-muted-foreground mt-1">Detected Product: {detectedProduct}</p>
                      <p className="text-xs text-primary mt-1">Ad Spend Est.: {spend}</p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="analytics-panel rounded-xl p-4 overflow-x-auto">
              <h2 className="text-lg font-semibold text-foreground mb-4">Opportunity Deep-Dive Table</h2>
              <table className="w-full min-w-[900px] text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-3 pr-3">Product Name</th><th className="py-3 pr-3">Category</th><th className="py-3 pr-3">Avg. Cost</th><th className="py-3 pr-3">Avg. SRP</th><th className="py-3 pr-3">Predicted Profit</th><th className="py-3 pr-3">Saturation Score</th><th className="py-3 pr-3">Actions</th></tr></thead>
                <tbody>
                  {opportunityRows.map(({ product, predictedProfit, saturationScore }) => {
                    const isSaved = savedProducts.some((item) => item.product_id === product.id)
                    const productId = String(product.id)
                    const isResearching = Boolean(scanningProducts[productId]) || isRedirecting
                    return (
                      <tr key={product.id} className="border-b border-border/60">
                        <td className="py-3 pr-3 font-medium text-foreground">{product.name}</td>
                        <td className="py-3 pr-3 text-muted-foreground">{product.category}</td>
                        <td className="py-3 pr-3 text-foreground">${(product.base_cost ?? 0).toFixed(2)}</td>
                        <td className="py-3 pr-3 text-foreground">${(product.market_price ?? 0).toFixed(2)}</td>
                        <td className="py-3 pr-3 text-emerald-400">${predictedProfit.toFixed(2)}</td>
                        <td className="py-3 pr-3 text-foreground">{saturationScore}</td>
                        <td className="py-3 pr-3"><div className="flex items-center gap-2">
                          <motion.button onClick={() => handleSaveToVault(product)} whileTap={{ scale: 0.97 }} className={`relative overflow-hidden px-3 py-1.5 min-h-11 rounded-lg border border-primary/40 transition-colors duration-200 transform-gpu touch-manipulation ${isSaved ? "text-foreground/70 border-primary/20 bg-primary/10" : "text-primary hover:bg-primary hover:text-white"}`}>
                            <span className="relative z-10 inline-flex items-center gap-1.5">{isSaved ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Saved</> : "Save to Vault"}</span>
                            <AnimatePresence>{recentlySavedProductId === product.id && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0">{[...Array(8)].map((_, i) => <motion.span key={i} className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-violet-300" initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos((i / 8) * Math.PI * 2) * 18, y: Math.sin((i / 8) * Math.PI * 2) * 12, opacity: 0, scale: 0.2 }} transition={{ duration: 0.45 }} />)}</motion.span>}</AnimatePresence>
                          </motion.button>
                          <button
                            onClick={() => handleDeepResearch(product)}
                            disabled={isResearching}
                            className="px-3 py-1.5 min-h-11 rounded-lg border border-border text-foreground hover:border-primary/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 inline-flex items-center gap-1.5 touch-manipulation"
                          >
                            {isResearching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {isResearching ? "Processing..." : "Deep Research (-1)"}
                          </button>
                        </div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>
      </main>
      {isRedirecting && (
        <div className="fixed inset-0 z-[90] bg-black/60 max-md:bg-black/75 flex items-center justify-center">
          <div className="rounded-xl border border-primary/30 bg-slate-950/90 px-5 py-3 text-sm text-foreground">
            Processing...
          </div>
        </div>
      )}
      <Dialog open={showGuestLock} onOpenChange={setShowGuestLock}>
        <DialogContent className="glass-panel border border-primary/30 bg-slate-950/95">
          <DialogHeader>
            <DialogTitle className="text-foreground">Guest Access Locked</DialogTitle>
            <DialogDescription>Your 3 free scans are finished. Sign up now to claim 300 credits.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 text-white"
            >
              Sign up to claim 300 Credits
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="fixed inset-0 pointer-events-none -z-0 max-md:hidden">
        <motion.div className="absolute -top-28 left-1/4 w-[30rem] h-[30rem] rounded-full blur-[130px] bg-violet-500/20" animate={{ x: [0, 40, -20, 0], y: [0, -20, 25, 0] }} transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[-10rem] right-1/4 w-[32rem] h-[32rem] rounded-full blur-[140px] bg-indigo-500/20" animate={{ x: [0, -35, 18, 0], y: [0, 12, -18, 0] }} transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-1/2 left-[45%] w-[24rem] h-[24rem] rounded-full blur-[120px] bg-blue-500/10" animate={{ opacity: [0.3, 0.6, 0.35] }} transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }} />
      </div>
    </div>
  )
}
