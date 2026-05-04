"use client"

import { memo, type MouseEvent } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Pencil, Star, Store, Trash2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"
import { AI_ACTION_CREDIT_COST, useAiCredits } from "@/hooks/use-ai-credits"
import { setActiveProductId } from "@/lib/products-engine"

interface ProductCardProps {
  product: {
    id: number | string
    title: string
    category: string
    image: string
    winRateScore: number
    tags: string[]
    cost: number
    srp: number
    profit: number
  }
  index: number
  mode?: "default" | "vault"
  statusBadge?: { label: string; tone: "ready" | "pending" }
  onOpenLab?: () => void
  onShopifyExport?: () => void
  onEditCopy?: () => void
  onDelete?: () => void
  selected?: boolean
  onToggleSelect?: () => void
  priority?: boolean
  onTogglePriority?: () => void
  onCardClick?: () => void
  onSaveToVault?: () => void
  actionLabel?: string
}

export const ProductCard = memo(function ProductCard({
  product,
  index,
  mode = "default",
  statusBadge,
  onOpenLab,
  onShopifyExport,
  onEditCopy,
  onDelete,
  selected = false,
  onToggleSelect,
  priority = false,
  onTogglePriority,
  onCardClick,
  onSaveToVault,
  actionLabel,
}: ProductCardProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const { credits, decrementCredit } = useAiCredits()

  const handleDeepAnalysisClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const productId = String(product.id)

    if (credits <= 0) {
      toast.error("You have no credits")
      return
    }

    const success = await decrementCredit()

    if (success) {
      setActiveProductId(productId)
      router.push(`/dashboard/product/${productId}`)
    }
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Viral":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30"
      case "High Margin":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "Low Ad-Fatigue":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      case "Trending":
        return "bg-primary/20 text-primary border-primary/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <motion.div
      initial={isMobile ? false : { opacity: 0, y: 20 }}
      animate={isMobile ? undefined : { opacity: 1, y: 0 }}
      transition={isMobile ? undefined : { delay: index * 0.1, duration: 0.2 }}
      whileHover={isMobile ? undefined : { scale: 1.02, boxShadow: "0 16px 30px rgba(2, 6, 23, 0.38)" }}
      whileTap={{ scale: 0.99 }}
      onClick={mode === "vault" ? onOpenLab : onCardClick}
      className="relative rounded-xl glass-panel overflow-hidden group will-change-transform cursor-pointer touch-manipulation"
    >
      {mode === "vault" && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation()
              onToggleSelect?.()
            }}
            className={`w-11 h-11 rounded border transition-colors flex items-center justify-center touch-manipulation ${
              selected ? "bg-primary border-primary" : "border-white/40 bg-black/30"
            }`}
            aria-label="Select product"
          />
          {statusBadge && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                statusBadge.tone === "ready"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/40"
                  : "bg-amber-500/15 text-amber-300 border-amber-400/40"
              }`}
            >
              {statusBadge.label}
            </span>
          )}
        </div>
      )}

      {/* Win-Rate glass badge */}
      <div className="absolute top-4 right-4 z-10 flex items-start gap-2">
        {mode === "vault" && (
          <button
            onClick={(event) => {
              event.stopPropagation()
              onTogglePriority?.()
            }}
            className={`w-11 h-11 rounded-lg border border-primary/30 flex items-center justify-center backdrop-blur-md bg-slate-950/55 transition-colors touch-manipulation ${
              priority
                ? "text-amber-300"
                : "text-muted-foreground hover:text-amber-300"
            }`}
            aria-label="Toggle priority"
          >
            <Star className={`w-4 h-4 ${priority ? "fill-amber-300" : ""}`} />
          </button>
        )}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + index * 0.07, duration: 0.2 }}
          className="rounded-xl px-3 py-1.5 border border-primary/30 bg-slate-950/55 backdrop-blur-md shadow-[0_0_18px_rgba(139,92,246,0.35)]"
        >
          <p className="text-[10px] uppercase tracking-wide text-primary/90 font-semibold">Score</p>
          <p className="text-sm font-extrabold text-white leading-tight">{product.winRateScore}%</p>
        </motion.div>
        {mode === "default" && (
          <button
            onClick={(event) => {
              event.stopPropagation()
              onSaveToVault?.()
            }}
            className="w-11 h-11 rounded-lg border border-primary/30 flex items-center justify-center backdrop-blur-md bg-slate-950/55 text-muted-foreground hover:text-amber-300 transition-colors touch-manipulation"
            aria-label="Save to vault"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Product Image */}
      <div className="relative h-48 bg-muted overflow-hidden">
        <Image
          src={product.image}
          alt={product.title}
          fill
          loading={index < 2 ? "eager" : "lazy"}
          priority={index < 2}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-tr from-violet-500/10 to-transparent" />
        {mode === "vault" && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div
              onClick={(event) => event.stopPropagation()}
              className="glass-panel rounded-xl px-2 py-1 flex items-center gap-1"
            >
              <button onClick={onShopifyExport} className="w-11 h-11 rounded-lg hover:bg-white/10 inline-flex items-center justify-center touch-manipulation">
                <Store className="w-4 h-4 text-primary" />
              </button>
              <button onClick={onEditCopy} className="w-11 h-11 rounded-lg hover:bg-white/10 inline-flex items-center justify-center touch-manipulation">
                <Pencil className="w-4 h-4 text-primary" />
              </button>
              <button onClick={onDelete} className="w-11 h-11 rounded-lg hover:bg-white/10 inline-flex items-center justify-center touch-manipulation">
                <Trash2 className="w-4 h-4 text-rose-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1 text-balance">
          {product.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{product.category}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.tags.map((badge) => (
            <span
              key={badge}
              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor(badge)}`}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Financial Data */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Cost</p>
            <p className="font-semibold text-foreground">${product.cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">SRP</p>
            <p className="font-semibold text-foreground">${product.srp.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Profit</p>
            <p className="font-semibold text-emerald-500">${product.profit.toFixed(2)}</p>
          </div>
        </div>

        {mode === "default" && (
          <motion.button
            type="button"
            whileHover={isMobile ? undefined : { scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={handleDeepAnalysisClick}
            className="w-full min-h-11 py-2.5 rounded-xl border border-primary/60 text-primary font-medium text-sm hover:bg-primary hover:text-white transition-colors duration-200 inline-flex items-center justify-center gap-1.5 touch-manipulation"
          >
            {actionLabel ?? `Deep Analysis (${AI_ACTION_CREDIT_COST})`}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
})
