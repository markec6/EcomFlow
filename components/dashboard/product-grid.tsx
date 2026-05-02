"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { ProductCard } from "./product-card"
import { normalizeProduct, seedProducts, setActiveProductId } from "@/lib/products-engine"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useAiCredits } from "@/hooks/use-ai-credits"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { spendCreditForProductScan } from "@/lib/credit-transactions"
import { useProducts } from "@/hooks/use-products"

interface ProductCardWrapperProps {
  product: ReturnType<typeof normalizeProduct>
  index: number
  credits: number
  isGuest: boolean
  isSpendingCredit: boolean
  onDeepAnalysis: (productId: string, productTitle: string) => void
  onSaveToVault: (productId: string) => void
  onCardClick: (productId: string) => void
}

const ProductCardWrapper = memo(function ProductCardWrapper({
  product,
  index,
  credits,
  isGuest,
  isSpendingCredit,
  onDeepAnalysis,
  onSaveToVault,
  onCardClick,
}: ProductCardWrapperProps) {
  const id = String(product.id)
  const handleDeepAnalysis = useCallback(() => onDeepAnalysis(id, product.title), [onDeepAnalysis, id, product.title])
  const handleSaveToVault = useCallback(() => onSaveToVault(id), [onSaveToVault, id])
  const handleCardClick = useCallback(() => onCardClick(id), [onCardClick, id])

  return (
    <ProductCard
      product={product}
      index={index}
      aiCreditsRemaining={credits}
      onDeepAnalysis={handleDeepAnalysis}
      onCardClick={handleCardClick}
      onSaveToVault={handleSaveToVault}
      isSpendingCredit={isSpendingCredit}
      actionLabel={isGuest ? "Proceed (1 Credit)" : undefined}
    />
  )
})

interface ProductGridProps {
  searchQuery: string
}

export function ProductGrid({ searchQuery }: ProductGridProps) {
  const router = useRouter()
  const [spendingProductId, setSpendingProductId] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showGuestLock, setShowGuestLock] = useState(false)
  const { credits, decrementCredit, isGuest, userId: activeUserId, setCredits, refreshCredits } = useAiCredits()
  const { products: rawProducts, isLoading } = useProducts({
    limit: 24,
    includeCompetitors: false,
    includeAiCopyVariations: false,
  })
  const products = useMemo(
    () => (rawProducts.length ? rawProducts : seedProducts).map(normalizeProduct),
    [rawProducts]
  )

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

  const handleDeepAnalysis = useCallback(async (productId: string, productTitle: string) => {
    if (spendingProductId || isRedirecting) return
    const toastId = `credits-${productId}`
    let redirected = false
    setSpendingProductId(productId)
    toast.loading("Spending 1 Credit...", { id: toastId })
    try {
      if (isGuest) {
        const creditSpent = await decrementCredit()
        if (!creditSpent) {
          setShowGuestLock(true)
          toast.error("No guest credits left. Sign up to claim 300 credits.", { id: toastId })
          return
        }
        toast.success(`Guest scan used for ${productTitle}`, { id: toastId })
        setActiveProductId(productId)
        router.push(`/products/${productId}`)
        return
      }

      const client = getSupabaseClient()
      if (!activeUserId) {
        await refreshCredits()
        toast.error("Session still syncing. Please try again.", { id: toastId })
        return
      }

      const result = await spendCreditForProductScan(client, activeUserId, productId)
      if (!result.ok) {
        if (result.reason === "insufficient_credits") {
          toast.error("No credits left. Top up to continue Deep Analysis.", { id: toastId })
        } else {
          toast.error("Could not spend credit. Please try again.", { id: toastId })
        }
        return
      }

      await setCredits(result.remainingCredits)
      setIsRedirecting(true)
      redirected = true
      setActiveProductId(productId)
      toast.success(`Analyzing ${productTitle}... 1 credit used.`, { id: toastId })
      router.push(`/products/${productId}`)
      window.setTimeout(() => {
        setSpendingProductId(null)
        setIsRedirecting(false)
      }, 3000)
    } catch {
      toast.error("Request timed out. Please retry.", { id: toastId })
    } finally {
      if (!redirected) {
        setSpendingProductId(null)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, activeUserId, credits, spendingProductId, isRedirecting])

  const handleSaveToVault = useCallback(async (productId: string) => {
    const client = getSupabaseClient()
    if (!client) return
    const { error } = await client.from("saved_products").insert({ user_id: "demo-user", product_id: productId, status: "saved" })
    if (error) {
      toast.error("Could not save product to vault.")
      return
    }
    toast.success("Product saved to vault.")
  }, [])

  const handleCardClick = useCallback((productId: string) => {
    setActiveProductId(productId)
  }, [])

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
        <ProductCardWrapper
          key={product.id}
          product={product}
          index={index}
          credits={credits}
          isGuest={isGuest}
          isSpendingCredit={spendingProductId === String(product.id)}
          onDeepAnalysis={handleDeepAnalysis}
          onSaveToVault={handleSaveToVault}
          onCardClick={handleCardClick}
        />
      ))}
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
