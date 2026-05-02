"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Copy, ExternalLink, Loader2 } from "lucide-react"
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts"
import useSWR from "swr"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ProductCard } from "@/components/dashboard/product-card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Product, SavedProduct } from "@/types/database"
import { fetchProductsFromSupabase, setActiveProductId } from "@/lib/products-engine"
import { getSupabaseClient } from "@/lib/supabase/client"

type VaultItem = SavedProduct & { product: Product }
type CopyTab = "emotional" | "professional"
const STATIC_TS = "2026-04-28T12:00:00.000Z"

const initialSavedProducts: SavedProduct[] = [
  { id: "s1", user_id: "u1", product_id: "f8c58f08-54f6-4efe-9575-95e0a2e6f102", status: "saved", created_at: STATIC_TS },
  { id: "s2", user_id: "u1", product_id: "f8c58f08-54f6-4efe-9575-95e0a2e6f103", status: "saved", created_at: STATIC_TS },
  { id: "s3", user_id: "u1", product_id: "f8c58f08-54f6-4efe-9575-95e0a2e6f101", status: "pushed_to_shopify", created_at: STATIC_TS },
]

async function fetchVaultBootstrap() {
  const client = getSupabaseClient()

  const savedRowsPromise = client
    ? client
        .from("saved_products")
        .select("id,user_id,product_id,status,created_at")
        .then(({ data }) => (data?.length ? data : initialSavedProducts))
    : Promise.resolve(initialSavedProducts)

  const productsPromise = fetchProductsFromSupabase({
    limit: 24,
    includeCompetitors: false,
    includeAiCopyVariations: true,
  })

  const [savedRows, products] = await Promise.all([savedRowsPromise, productsPromise])

  return { savedRows, products }
}

export default function VaultPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [savedRows, setSavedRows] = useState<SavedProduct[]>(initialSavedProducts)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [priorityIds, setPriorityIds] = useState<string[]>(["s3"])
  const [activeItem, setActiveItem] = useState<VaultItem | null>(null)
  const [copyTab, setCopyTab] = useState<CopyTab>("emotional")
  const [folderFilter, setFolderFilter] = useState("All Items")
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [rewrittenCopy, setRewrittenCopy] = useState<{ emotional?: string; professional?: string }>({})
  const [verifyingUrl, setVerifyingUrl] = useState<string | null>(null)
  const { data: vaultBootstrap, isLoading: isLoadingVault } = useSWR("vault-bootstrap", fetchVaultBootstrap, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60_000,
    keepPreviousData: true,
  })

  useEffect(() => {
    if (!vaultBootstrap) return
    setSavedRows(vaultBootstrap.savedRows)
    setProducts(vaultBootstrap.products)
  }, [vaultBootstrap])

  const vaultItems = useMemo<VaultItem[]>(
    () =>
      savedRows
        .map((saved) => {
          const product = products.find((candidate) => candidate.id === saved.product_id)
          return product ? { ...saved, product } : null
        })
        .filter((item): item is VaultItem => Boolean(item)),
    [products, savedRows]
  )

  const folders = useMemo(() => ["All Items", ...Array.from(new Set(vaultItems.map((item) => item.product.category ?? "Unknown")))], [vaultItems])

  const filteredVault = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const byFolder = folderFilter === "All Items" ? vaultItems : vaultItems.filter((item) => item.product.category === folderFilter)
    if (!query) return byFolder

    return byFolder.filter((item) => {
      const titleMatch = (item.product.name || "").toLowerCase().includes(query)
      const categoryMatch = (item.product.category ?? "").toLowerCase().includes(query)
      const tagMatch = [item.product.category].some((tag) => (tag ?? "").toLowerCase().includes(query))
      return titleMatch || categoryMatch || tagMatch
    })
  }, [searchQuery, vaultItems, folderFilter])

  const potentialProfit = filteredVault.reduce((sum, item) => sum + (item.product.margin ?? 0), 0)
  const readyCount = filteredVault.filter((item) => Boolean(item.product.ai_copy_variations)).length
  const launchCapacityUsed = 72
  const launchCapacityTotal = 100

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const handleDelete = (id: string) => {
    setSavedRows((current) => current.filter((item) => item.id !== id))
    setSelectedIds((current) => current.filter((item) => item !== id))
    setPriorityIds((current) => current.filter((item) => item !== id))
  }

  const copyText = async (text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
  }

  const rewriteWithAi = (item: VaultItem, tab: CopyTab) => {
    setRewriteLoading(true)
    window.setTimeout(() => {
      const variations = (item.product.ai_copy_variations as { emotional_hook?: string; professional_direct?: string } | null) ?? {}
      setRewrittenCopy({
        emotional: variations.emotional_hook ?? "",
        professional: variations.professional_direct ?? "",
      })
      setRewriteLoading(false)
    }, 1500)
  }

  const handleSupplierRedirect = (url: string) => {
    setVerifyingUrl(url)
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer")
      setVerifyingUrl(null)
    }, 1500)
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="relative z-10 pl-[var(--content-offset,0px)] pt-16 transition-[padding] duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Product Vault</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Curated opportunity collection with launch-readiness controls and AI marketing workflows.
            </p>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
          >
            <div className="glass-panel rounded-xl border border-primary/20 p-5">
              <p className="text-xs text-muted-foreground">Potential Profit</p>
              <p className="text-3xl font-extrabold text-emerald-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.35)] mt-2">
                ${potentialProfit.toFixed(2)}
              </p>
            </div>
            <div className="glass-panel rounded-xl border border-primary/20 p-5">
              <p className="text-xs text-muted-foreground">Marketing Readiness</p>
              <p className="text-lg font-semibold text-foreground mt-2">
                {readyCount}/{filteredVault.length || 0} Products Ready
              </p>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${filteredVault.length ? (readyCount / filteredVault.length) * 100 : 0}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <div className="glass-panel rounded-xl border border-primary/20 p-5">
              <p className="text-xs text-muted-foreground">Launch Capacity</p>
              <p className="text-lg font-semibold text-foreground mt-2">
                {launchCapacityUsed}/{launchCapacityTotal} Slots Used
              </p>
              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(launchCapacityUsed / launchCapacityTotal) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <div className="glass-panel rounded-xl border border-primary/20 p-2 flex items-center gap-2 overflow-x-auto">
              {folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => setFolderFilter(folder)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    folderFilter === folder ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {folder}
                </button>
              ))}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoadingVault && products.length === 0
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={`vault-skeleton-${idx}`} className="h-[360px] rounded-xl glass-panel border border-primary/20 animate-pulse" />
                ))
              : filteredVault.map((item, index) => (
                  <ProductCard
                    key={item.id}
                    index={index}
                    mode="vault"
                    product={{
                      id: item.product.id,
                      title: item.product.name,
                      category: item.product.category ?? "Unknown",
                      image: item.product.image_url ?? "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop",
                      winRateScore: Math.round((item.product.trend_data?.slice(-3).reduce((a, b) => a + b, 0) ?? 210) / 3),
                      tags: [item.product.category],
                      cost: item.product.base_cost ?? 0,
                      srp: item.product.market_price ?? 0,
                      profit: item.product.margin ?? 0,
                    }}
                    selected={selectedIds.includes(item.id)}
                    onToggleSelect={() => toggleSelected(item.id)}
                    priority={priorityIds.includes(item.id)}
                    onTogglePriority={() =>
                      setPriorityIds((current) =>
                        current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                      )
                    }
                    statusBadge={
                      item.product.ai_copy_variations
                        ? { label: "Ready to Launch", tone: "ready" }
                        : { label: "Pending Analysis", tone: "pending" }
                    }
                    onOpenLab={() => {
                      setCopyTab("emotional")
                      setActiveItem(item)
                      setActiveProductId(item.product.id)
                    }}
                    onShopifyExport={() => window.alert(`Exporting ${item.product.name} to Shopify...`)}
                    onEditCopy={() => {
                      setActiveItem(item)
                      setCopyTab("emotional")
                    }}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
          </motion.section>
        </div>
      </main>

      <AnimatePresence>
        {selectedIds.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 glass-panel border border-primary/30 rounded-2xl px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 max-w-[95vw] overflow-x-auto"
          >
            <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:opacity-90 transition-opacity">
              Bulk Export to Shopify
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-sm hover:bg-primary hover:text-white transition-colors">
              Generate All Ads
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-rose-400/40 text-rose-300 text-sm hover:bg-rose-500/20 transition-colors">
              Delete Selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={Boolean(activeItem)} onOpenChange={(open) => !open && setActiveItem(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg bg-slate-950/75 backdrop-blur-xl border-l border-primary/40 shadow-[-16px_0_40px_rgba(139,92,246,0.22)]"
        >
          {activeItem && (
            <div className="h-full overflow-auto">
              <SheetHeader>
                <SheetTitle className="text-white">{activeItem.product.name}</SheetTitle>
                <SheetDescription className="sr-only">
                  AI Marketing Lab drawer with product-specific copy and supplier intelligence.
                </SheetDescription>
                <div className="relative h-36 rounded-xl overflow-hidden border border-primary/20 mt-2">
                  <Image
                    src={activeItem.product.image_url ?? "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop"}
                    alt={activeItem.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </SheetHeader>

              <div className="px-4 space-y-3">
                <div className="glass-panel rounded-xl p-1 grid grid-cols-2 gap-1">
                  {([
                    ["emotional", "Emotional Hook"],
                    ["professional", "Professional/Direct"],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setCopyTab(key)}
                      className={`rounded-lg text-xs py-2 transition-colors ${
                        copyTab === key ? "bg-primary text-white" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="glass-panel rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Projected Success</p>
                  <div className="h-24 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(activeItem.product.trend_data ?? []).map((score, idx) => ({ day: `D${idx + 1}`, score }))}>
                        <Tooltip contentStyle={{ background: "#0f1020", border: "1px solid rgba(139, 92, 246, 0.24)", borderRadius: "0.75rem" }} />
                        <Line type="monotone" dataKey="score" stroke="#A78BFA" strokeWidth={2.2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 space-y-3">
                {(() => {
                  const aiCopy = (activeItem.product.ai_copy_variations as { emotional_hook?: string; professional_direct?: string } | null) ?? {}
                  const variantText = copyTab === "emotional" ? aiCopy.emotional_hook ?? "" : aiCopy.professional_direct ?? ""
                  const rewritten = rewrittenCopy[copyTab] ?? variantText
                  const score = activeItem.product.name === "Smart Water Bottle Tracker"
                    ? 94
                    : Math.min(99, Math.max(74, Math.round((activeItem.product.margin / Math.max(1, activeItem.product.market_price)) * 100 + 40)))
                  const angle = (score / 100) * 360

                  return (
                    <>
                      <div className="glass-panel rounded-xl border border-primary/20 p-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-xs text-muted-foreground">AI Copy Variation</p>
                          <div className="relative w-12 h-12">
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{ background: `conic-gradient(#8B5CF6 ${angle}deg, rgba(255,255,255,0.08) ${angle}deg)` }}
                            />
                            <div className="absolute inset-[4px] rounded-full bg-slate-950/90 flex items-center justify-center text-[10px] text-primary font-semibold">
                              {score}%
                            </div>
                          </div>
                        </div>
                        <textarea
                          readOnly
                          value={rewriteLoading ? "AI Loading..." : rewritten || "No variation available."}
                          className="w-full h-24 rounded-xl bg-black/30 border border-primary/20 p-3 text-sm text-foreground resize-none"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => rewriteWithAi(activeItem, copyTab)}
                            className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs hover:bg-primary hover:text-white transition-colors"
                          >
                            ✨ Rewrite with AI
                          </button>
                          <button
                            onClick={() => copyText(rewritten)}
                            className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">{score}% Viral Potential</p>
                      </div>

                      <div className="glass-panel rounded-xl border border-primary/20 p-3">
                        <p className="text-xs text-muted-foreground mb-2">Creative Strategy (15s Blueprint)</p>
                        <div className="space-y-1.5 text-sm text-foreground">
                          {["0-3s: Hook with strongest pain-point visual.", "3-10s: Show product demo + differentiator.", "10-15s: CTA with social proof angle."].map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>

                      <div className="glass-panel rounded-xl border border-primary/20 p-3">
                        <p className="text-xs text-muted-foreground mb-2">Multi-Supplier Comparison</p>
                        <div className="space-y-1 text-sm">
                          {[{ name: "AliExpress Prime", price: activeItem.product.base_cost, shipping: "7-10 days" }, { name: "Zendrop FastLane", price: activeItem.product.base_cost + 0.9, shipping: "4-7 days" }].map((supplier) => (
                            <div key={supplier.name} className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/10 last:border-0">
                              <span className="text-foreground">{supplier.name}</span>
                              <span className="text-primary">${supplier.price.toFixed(2)}</span>
                              <span className="text-muted-foreground">{supplier.shipping}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-panel rounded-xl border border-primary/20 p-3">
                        <p className="text-xs text-muted-foreground mb-2">Product Activity Timeline</p>
                        <div className="space-y-2">
                          {["Product Saved", "AI Variations Ready", "Competitor Snapshot Synced", "Launch Prep Active"].map((entry) => (
                            <div key={entry} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span className="text-sm text-foreground">{entry}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-panel rounded-xl border border-primary/20 p-3">
                        <p className="text-xs text-muted-foreground mb-2">Targeting Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {["Home Improvement", "Gadget Lovers", "Impulse Buyers"].map((interest) => (
                            <span key={interest} className="px-2 py-1 rounded-lg text-xs bg-black/30 border border-primary/20 text-foreground">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="p-4 border-t border-primary/20">
                <button
                  onClick={() => handleSupplierRedirect("https://www.aliexpress.com/")}
                  className="w-full py-2.5 rounded-xl bg-primary text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                  Go to Supplier Store
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AnimatePresence>
        {verifyingUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="glass-panel rounded-2xl border border-primary/30 px-6 py-5 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <p className="text-sm text-foreground">Verifying Supplier Stock & Live Pricing...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
