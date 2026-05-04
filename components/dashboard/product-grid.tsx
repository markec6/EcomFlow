"use client"

import { memo, useCallback, useMemo } from "react"
import { ProductCard } from "./product-card"
import { normalizeProduct, seedProducts, setActiveProductId } from "@/lib/products-engine"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAiCredits } from "@/hooks/use-ai-credits"
import { toast } from "sonner"
import { useProducts } from "@/hooks/use-products"

interface ProductCardWrapperProps {
  product: ReturnType<typeof normalizeProduct>
  index: number
  isGuest: boolean
  onSaveToVault: (productId: string) => void
  onCardClick: (productId: string) => void
}

const ProductCardWrapper = memo(function ProductCardWrapper({
  product,
  index,
  isGuest,
  onSaveToVault,
  onCardClick,
}: ProductCardWrapperProps) {
  const id = String(product.id)
  const handleSaveToVault = useCallback(() => onSaveToVault(id), [onSaveToVault, id])
  const handleCardClick = useCallback(() => onCardClick(id), [onCardClick, id])

  return (
    <ProductCard
      product={product}
      index={index}
      onCardClick={handleCardClick}
      onSaveToVault={handleSaveToVault}
      actionLabel={isGuest ? "Proceed (1 Credit)" : undefined}
    />
  )
})

interface ProductGridProps {
  searchQuery: string
}

export function ProductGrid({ searchQuery }: ProductGridProps) {
  const { isGuest } = useAiCredits()
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
          isGuest={isGuest}
          onSaveToVault={handleSaveToVault}
          onCardClick={handleCardClick}
        />
      ))}
    </div>
  )
}
