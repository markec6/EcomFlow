"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ProductSelect } from "@/components/dashboard/product-select"
import { Loader2, Play } from "lucide-react"
import {
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { fetchProductsFromSupabase, getActiveProductId, seedProducts, setActiveProductId } from "@/lib/products-engine"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAiCredits } from "@/hooks/use-ai-credits"
import { spendCreditForProductScan } from "@/lib/credit-transactions"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Competitor = {
  id: string
  storeName: string
  videoUrl: string
  pricingData: { name: string; value: number }[]
  saturationScore: number
  saturationLabel: string
  trafficData: { name: string; value: number }[]
  topProducts: { name: string; orders: number; price: number }[]
}

const trafficColors = ["#8B5CF6", "#A78BFA", "#22C55E", "#06B6D4"]

export default function CompetitorsPage() {
  const router = useRouter()
  const { setCredits, decrementCredit, userId: activeUserId } = useAiCredits()
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<typeof seedProducts>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [activeCompetitorId, setActiveCompetitorId] = useState("")
  const [isLoadingProductData, setIsLoadingProductData] = useState(true)
  const [loadedVideoIds, setLoadedVideoIds] = useState<Record<string, boolean>>({})
  const [scanningRows, setScanningRows] = useState<Record<string, boolean>>({})
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showGuestLock, setShowGuestLock] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchProductsFromSupabase().then((rows) => {
      if (!mounted) return
      const activeProductId = getActiveProductId() ?? rows[0]?.id ?? seedProducts[0].id
      setProducts(rows)
      setSelectedProductId(activeProductId)
      setIsLoadingProductData(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const activeProduct = products.find((item) => item.id === selectedProductId) ?? products[0] ?? seedProducts[0]
    if (!activeProduct) return
    const rawCompetitors = Array.isArray(activeProduct.competitors) ? activeProduct.competitors : []
    const mapped = rawCompetitors.map((entry, idx) => {
      const competition = Math.max(0, Math.min(100, Number(activeProduct.saturation_score ?? 0)))
      const traffic = typeof entry.traffic_sources === "object" && entry.traffic_sources
        ? Object.entries(entry.traffic_sources as Record<string, number>)
        : []

      return {
        id: `${activeProduct.id}-${idx}`,
        storeName: String(entry.name ?? `Competitor ${idx + 1}`),
        videoUrl: String(entry.ad_video_url ?? ""),
        pricingData: [
          { name: "Their Price", value: Number(entry.price ?? 0) },
          { name: "Market Avg", value: Number(activeProduct.market_price ?? 0) },
          { name: "Your Price", value: Number((activeProduct.market_price ?? 0) * 0.93) },
        ],
        saturationScore: competition,
        saturationLabel: competition > 70 ? "Saturated - High Ad Spend" : competition > 45 ? "Balanced - Moderate Competition" : "Blue Ocean - Low Competition",
        trafficData: traffic.map(([name, value]) => ({
          name: name === "fb" ? "Facebook" : name.charAt(0).toUpperCase() + name.slice(1),
          value: Number(value ?? 0),
        })),
        topProducts: (Array.isArray(entry.top_products) ? entry.top_products : []).map((top) => ({
          name: String(top.name ?? "Unknown Product"),
          orders: Number(top.orders ?? 0),
          price: Number(top.price ?? 0),
        })),
      }
    })

    setLoadedVideoIds({})
    setCompetitors(mapped)
    setActiveCompetitorId(mapped[0]?.id ?? "")
  }, [products, selectedProductId])

  const activeCompetitor = useMemo(
    () => competitors.find((item) => item.id === activeCompetitorId) ?? competitors[0],
    [activeCompetitorId, competitors]
  )

  const gaugeOffset = 283 - (Math.max(0, Math.min(100, activeCompetitor?.saturationScore ?? 0)) / 100) * 283

  const handleDeepScan = async (rowId: string) => {
    if (scanningRows[rowId] || isRedirecting) return
    setScanningRows((current) => ({ ...current, [rowId]: true }))
    const client = getSupabaseClient()
    if (!activeUserId) {
      const creditSpent = await decrementCredit()
      if (!creditSpent) {
        setScanningRows((current) => ({ ...current, [rowId]: false }))
        setShowGuestLock(true)
        return
      }
      toast.success("Guest deep scan started.")
      if (selectedProductId) {
        setIsRedirecting(true)
        window.location.href = `/products/${selectedProductId}`
      } else {
        setScanningRows((current) => ({ ...current, [rowId]: false }))
      }
      return
    }
    const result = await spendCreditForProductScan(client, activeUserId, selectedProductId)

    if (!result.ok) {
      if (result.reason === "duplicate") {
        toast.info("Scan already started. Please wait a moment.")
      } else if (result.reason === "insufficient_credits") {
        window.alert("Insufficient credits.")
      } else {
        toast.error("Could not start scan. Please try again.")
      }
      setScanningRows((current) => ({ ...current, [rowId]: false }))
      return
    }

    void setCredits(result.remainingCredits)
    toast.success("Analyzing product... 1 credit used.")
    if (selectedProductId) {
      setIsRedirecting(true)
      window.location.href = `/products/${selectedProductId}`
      return
    }
    setScanningRows((current) => ({ ...current, [rowId]: false }))
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="relative z-10 pl-[var(--content-offset,0px)] pt-16 transition-[padding] duration-300 ease-in-out">
        <div className="p-4 md:p-6 space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-bold text-foreground">Competitor Spy</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time competitor intelligence to position pricing, creative, and product offers.
            </p>
          </motion.div>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="mb-3">
              <ProductSelect
                value={selectedProductId}
                onChange={(value) => {
                  setSelectedProductId(value)
                  setActiveProductId(value)
                }}
                options={products.map((product) => ({ id: product.id, name: product.name, image_url: product.image_url, category: product.category }))}
              />
            </div>
            <AnimatePresence mode="wait">
            <motion.div
              key={`product-${selectedProductId}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="-mx-4 px-0 md:mx-0 md:px-0 flex md:grid md:grid-cols-3 gap-0 md:gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory"
            >
              {competitors.map((competitor) => {
                const selected = competitor.id === activeCompetitorId
                return (
                  <motion.button
                    key={competitor.id}
                    onClick={() => setActiveCompetitorId(competitor.id)}
                    animate={
                      selected
                        ? { boxShadow: ["0 0 14px rgba(168,85,247,0.25)", "0 0 20px rgba(168,85,247,0.4)", "0 0 14px rgba(168,85,247,0.25)"] }
                        : { boxShadow: "0 0 0 rgba(0,0,0,0)" }
                    }
                    transition={{ duration: 1.8, repeat: selected ? Infinity : 0, ease: "easeInOut" }}
                    className={`snap-center shrink-0 w-full min-w-full md:min-w-0 md:w-auto rounded-2xl p-3 border transition-all relative overflow-hidden ${
                      selected
                        ? "border-primary shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                        : "border-primary/20 hover:border-primary/40 opacity-80"
                    }`}
                  >
                    <div className="absolute inset-0 glass-panel pointer-events-none" />
                    <div className="relative h-40 rounded-xl overflow-hidden mb-3">
                      {!loadedVideoIds[competitor.id] && (
                        <div className="absolute inset-0 bg-slate-900/90 animate-pulse border border-primary/20 rounded-xl z-10" />
                      )}
                      <video
                        src={competitor.videoUrl}
                        className={`w-full h-full object-cover transition-all ${selected ? "" : "grayscale blur-[1px]"}`}
                        muted
                        loop
                        autoPlay
                        playsInline
                        controls
                        onLoadedData={() => {
                          setLoadedVideoIds((current) => ({ ...current, [competitor.id]: true }))
                        }}
                      />
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/45 to-transparent" />
                      <Play className="absolute bottom-2 right-2 w-4 h-4 text-white/85" />
                      {selected && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-white border border-primary/70">
                          Target Identified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{competitor.storeName}</p>
                      <motion.span
                        className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>
            </AnimatePresence>
          </motion.section>

          {!isLoadingProductData && competitors.length === 0 && (
            <div className="glass-panel rounded-xl border border-primary/20 p-5">
              <p className="text-sm text-muted-foreground">No competitor data available for this niche.</p>
            </div>
          )}

          {activeCompetitor && <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Analyzing Intelligence for:{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                {activeCompetitor?.storeName ?? "No Competitor Selected"}
              </span>
            </h2>
          </motion.section>}

          {activeCompetitor && <AnimatePresence mode="wait">
            <motion.section
              key={activeCompetitor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-4"
            >
              <div className="glass-panel rounded-xl border border-primary/20 p-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">Pricing Matrix</h2>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeCompetitor.pricingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.12)" />
                      <XAxis dataKey="name" stroke="#a1a1aa" tickLine={false} axisLine={false} />
                      <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#ffffff", color: "#0f172a", border: "1px solid rgba(139, 92, 246, 0.24)", borderRadius: "0.75rem" }} />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} animationDuration={500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel rounded-xl border border-primary/20 p-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">Store Saturation Gauge</h2>
                <div className="flex flex-col items-center justify-center">
                  <svg viewBox="0 0 220 130" className="w-full max-w-[280px]">
                    <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="16" strokeLinecap="round" />
                    <motion.path
                      d="M20 110 A90 90 0 0 1 200 110"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      animate={{ strokeDashoffset: gaugeOffset }}
                      transition={{ type: "spring", damping: 18, stiffness: 120 }}
                    />
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22C55E" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#EF4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <p className="text-3xl font-extrabold text-foreground mt-2">{activeCompetitor.saturationScore}%</p>
                  <span className="mt-2 px-3 py-1 rounded-full text-xs border border-primary/30 bg-primary/10 text-primary">
                    {activeCompetitor.saturationLabel}
                  </span>
                </div>
              </div>
            </motion.section>
          </AnimatePresence>}

          {activeCompetitor && <AnimatePresence mode="wait">
            <motion.section
              key={`${activeCompetitor.id}-traffic`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="glass-panel rounded-xl border border-primary/20 p-4"
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">Traffic Sources</h2>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activeCompetitor.trafficData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                      {activeCompetitor.trafficData.map((entry, idx) => (
                        <Cell key={entry.name} fill={trafficColors[idx % trafficColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#ffffff", color: "#0f172a", border: "1px solid rgba(139, 92, 246, 0.24)", borderRadius: "0.75rem" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          </AnimatePresence>}

          {activeCompetitor && <AnimatePresence mode="wait">
            <motion.section
              key={`${activeCompetitor.id}-table`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="glass-panel rounded-xl border border-primary/20 p-4 overflow-x-auto"
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Best Selling Products for {activeCompetitor.storeName}
              </h2>
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-3 pr-3">Product Name</th>
                    <th className="py-3 pr-3">Estimated Orders</th>
                    <th className="py-3 pr-3">Price</th>
                    <th className="py-3 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCompetitor.topProducts.map((product, index) => {
                    const rowId = `${activeCompetitor.id}-${product.name}-${index}`
                    const isScanning = Boolean(scanningRows[rowId]) || isRedirecting
                    return (
                    <tr key={rowId} className="border-b border-border/60">
                      <td className="py-3 pr-3 text-foreground font-medium">{product.name}</td>
                      <td className="py-3 pr-3 text-foreground">{product.orders.toLocaleString()}</td>
                      <td className="py-3 pr-3 text-primary">${product.price.toFixed(2)}</td>
                      <td className="py-3 pr-3">
                        <button
                          onClick={() => handleDeepScan(rowId)}
                          disabled={isScanning}
                          className="px-3 py-1.5 min-h-11 rounded-lg border border-primary/40 text-primary hover:bg-primary hover:text-white disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 inline-flex items-center gap-1.5 touch-manipulation"
                        >
                          {isScanning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {isScanning ? "Processing..." : "Deep Scan"}
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </motion.section>
          </AnimatePresence>}
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
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 text-white"
            >
              Sign up to claim 300 Credits
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed inset-0 pointer-events-none -z-0 max-md:hidden">
        <motion.div
          className="absolute -top-28 left-1/4 w-[30rem] h-[30rem] rounded-full blur-[130px] bg-violet-500/20"
          animate={{ x: [0, 40, -20, 0], y: [0, -20, 25, 0] }}
          transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10rem] right-1/4 w-[32rem] h-[32rem] rounded-full blur-[140px] bg-indigo-500/20"
          animate={{ x: [0, -35, 18, 0], y: [0, 12, -18, 0] }}
          transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-[45%] w-[24rem] h-[24rem] rounded-full blur-[120px] bg-blue-500/10"
          animate={{ opacity: [0.3, 0.6, 0.35] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  )
}
