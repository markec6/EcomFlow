"use client"

import { useEffect, useMemo, useState } from "react"
import { ProductCard } from "./product-card"
import { fetchProductsFromSupabase, normalizeProduct, setActiveProductId } from "@/lib/products-engine"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useAiCredits } from "@/hooks/use-ai-credits"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Zap } from "lucide-react"

interface ProductGridProps {
  searchQuery: string
}

export function ProductGrid({ searchQuery }: ProductGridProps) {
  const router = useRouter()
  const [products, setProducts] = useState<ReturnType<typeof normalizeProduct>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [spendingProductId, setSpendingProductId] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showBuyMore, setShowBuyMore] = useState(false)
  const [showGuestLock, setShowGuestLock] = useState(false)
  const { credits, decrementCredit, isGuest } = useAiCredits()

  useEffect(() => {
    let mounted = true
    fetchProductsFromSupabase().then((rows) => {
      if (!mounted) return
      setProducts(rows.map(normalizeProduct))
      setIsLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return products

    return products.filter((product) => {
      const inTitle = product.title.toLowerCase().includes(query)
      const inCategory = product.category.toLowerCase().includes(query)
      const inTags = product.tags.some((tag) => tag.toLowerCase().includes(query))
      return inTitle || inCategory || inTags
    })
  }, [products, searchQuery])

  const handleDeepAnalysis = async (productId: string, productTitle: string) => {
    if (spendingProductId || isRedirecting) return
    const creditSpent = await decrementCredit()
    if (!creditSpent) {
      if (isGuest) {
        router.push("/signup")
        return
      }
      setShowBuyMore(true)
      return
    }
    setSpendingProductId(productId)
    toast.loading("Spending 1 Credit...", { id: `credits-${productId}` })
    if (isGuest) {
      window.setTimeout(() => {
        toast.success(`Guest scan used for ${productTitle}`, { id: `credits-${productId}` })
        setSpendingProductId(null)
      }, 500)
      return
    }
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        resolve()
      }, 900)
    })
    setIsRedirecting(true)
    setActiveProductId(productId)
    toast.success(`Deep Analysis started for ${productTitle}`, { id: `credits-${productId}` })
    router.push(`/product/${productId}`)
    window.setTimeout(() => {
      setSpendingProductId(null)
      setIsRedirecting(false)
    }, 3000)
  }

  const handleSaveToVault = async (productId: string) => {
    const client = getSupabaseClient()
    if (!client) return
    const { error } = await client.from("saved_products").insert({ user_id: "demo-user", product_id: productId, status: "saved" })
    if (error) {
      toast.error("Could not save product to vault.")
      return
    }
    toast.success("Product saved to vault.")
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-[360px] rounded-xl glass-panel border border-primary/20 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProducts.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          onDeepAnalysis={() => handleDeepAnalysis(String(product.id), product.title)}
          aiCreditsRemaining={credits}
          onCardClick={() => setActiveProductId(String(product.id))}
          onSaveToVault={() => handleSaveToVault(String(product.id))}
          isSpendingCredit={spendingProductId === String(product.id)}
          actionLabel={isGuest ? "Proceed (1 Credit)" : undefined}
        />
      ))}
      <Dialog open={showBuyMore} onOpenChange={setShowBuyMore}>
        <DialogContent className="glass-panel border border-primary/30 bg-slate-950/95">
          <DialogHeader>
            <DialogTitle className="text-foreground">No Credits Left</DialogTitle>
            <DialogDescription>Top up your credits to continue Deep Analysis and unlock AI intelligence.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-primary/20 p-3 bg-black/20 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm text-foreground">Current balance: {credits} credits</p>
          </div>
          <DialogFooter>
            <button onClick={() => setShowBuyMore(false)} className="px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors">Buy More</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showGuestLock} onOpenChange={setShowGuestLock}>
        <DialogContent className="glass-panel border border-primary/30 bg-slate-950/95">
          <DialogHeader>
            <DialogTitle className="text-foreground">Free Scans Used</DialogTitle>
            <DialogDescription>You unlocked all 3 guest scans. Create your account to claim 300 credits instantly.</DialogDescription>
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
      {isRedirecting && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-xl border border-primary/30 bg-slate-950/90 px-5 py-3 text-sm text-foreground">
            Processing...
          </div>
        </div>
      )}
    </div>
  )
}
