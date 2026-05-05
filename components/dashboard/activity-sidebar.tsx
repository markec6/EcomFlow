"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Package, Clock, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** Matches `ProductCard` default motion (components/dashboard/product-card.tsx). */
const CARD_HOVER_SHADOW = "0 16px 30px rgba(2, 6, 23, 0.38)"

const cardMotionTransition = { duration: 0.2, delay: 0 } as const

const liveUpdates = [
  {
    id: 1,
    icon: TrendingUp,
    text: "Portable Heater spiking in UK",
    change: "+140%",
    time: "2m ago",
    color: "text-emerald-500",
    insights: [
      "Search and paid-social volume for compact ceramic heaters jumped sharply across UK metros as colder snaps collided with energy-cost headlines.",
      "Creative angles showing rapid heat-up and safety certifications are outperforming lifestyle-only clips; hook retention is strongest in the first 1.5s.",
      "Watch adjacent EU markets (DE/FR): similar demand curves often lag UK spikes by roughly two trading days.",
    ],
  },
  {
    id: 2,
    icon: Package,
    text: "New supplier found for 'Orthopedic Pillow'",
    change: null,
    time: "5m ago",
    color: "text-primary",
    insights: [
      "A tier-2 foam OEM with existing orthopedic certifications surfaced in our supplier graph—lead times quoted under peak-season averages.",
      "Sample batches mapped closely to your vault pillow SKU on density and contour specs; variance on outer cover GSM is negligible.",
      "Negotiation signal: competitors quoting landed parity have been thinning MOQ—worth prioritizing DDU quotes before Chinese New Year slack.",
    ],
  },
  {
    id: 3,
    icon: TrendingUp,
    text: "Galaxy Projector viral on TikTok",
    change: "+89%",
    time: "12m ago",
    color: "text-emerald-500",
    insights: [
      "Short-loop TikTok remixes using ceiling-mounted demos are carrying most of the viral load; stitch chains extend organic reach without heavy spend.",
      "Audience skew is 18–34 with strongest pockets in UK/US evenings—placement pacing aligns with dual peak windows.",
      "Fatigue risk is still moderate: novelty galaxy palettes outperform single-scene repeats by a wide margin in engagement proxies.",
    ],
  },
  {
    id: 4,
    icon: TrendingUp,
    text: "Smart Bottle trending in Germany",
    change: "+67%",
    time: "18m ago",
    color: "text-emerald-500",
    insights: [
      "Hydration trackers with hydration reminders resonate in DE wellness cohorts; sustainability-forward copy lifts CTR versus purely tech-led messaging.",
      "Amazon DE visibility climbed alongside influencer seeding on Instagram Reels cross-posted to TikTok DE.",
      "Pricing elasticity appears favorable in the €35–€48 band before discounting—avoid anchoring too low on launch.",
    ],
  },
]

const recentOutreach = [
  {
    id: 1,
    name: "Shenzhen Tech Co.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    status: "Pending Reply",
    statusColor: "bg-amber-500/20 text-amber-500",
  },
  {
    id: 2,
    name: "Guangzhou Supply",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    status: "Replied",
    statusColor: "bg-emerald-500/20 text-emerald-500",
  },
  {
    id: 3,
    name: "Yiwu Wholesale",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
    status: "Pending Reply",
    statusColor: "bg-amber-500/20 text-amber-500",
  },
]

export function ActivitySidebar() {
  const isMobile = useIsMobile()
  const [intelOpen, setIntelOpen] = useState(false)
  const [selectedIntel, setSelectedIntel] = useState<(typeof liveUpdates)[number] | null>(null)

  const openIntel = (update: (typeof liveUpdates)[number]) => {
    setSelectedIntel(update)
    setIntelOpen(true)
  }

  const handleIntelOpenChange = (open: boolean) => {
    setIntelOpen(open)
    if (!open) {
      window.setTimeout(() => setSelectedIntel(null), 180)
    }
  }

  return (
    <aside className="w-full h-full flex flex-col gap-4">
      {/* AI Live Intelligence */}
      <motion.div
        initial={isMobile ? false : { opacity: 0, y: 20 }}
        animate={isMobile ? undefined : { opacity: 1, y: 0 }}
        transition={isMobile ? undefined : cardMotionTransition}
        className="rounded-2xl glass-panel border border-border/60 p-4 flex-1 will-change-transform"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">AI Live Intelligence</h3>
          <span
            className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.65)]"
            aria-hidden
          />
        </div>

        <div className="space-y-3">
          {liveUpdates.map((update) => (
            <motion.div
              key={update.id}
              role="button"
              tabIndex={0}
              initial={isMobile ? false : { opacity: 0, y: 20 }}
              animate={isMobile ? undefined : { opacity: 1, y: 0 }}
              transition={isMobile ? undefined : { duration: 0.2, delay: 0 }}
              whileHover={
                isMobile
                  ? undefined
                  : { scale: 1.02, boxShadow: CARD_HOVER_SHADOW }
              }
              whileTap={{ scale: 0.99 }}
              onClick={() => openIntel(update)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  openIntel(update)
                }
              }}
              className="group relative rounded-xl glass-panel overflow-hidden border border-primary/15 p-3 cursor-pointer touch-manipulation outline-none transition-colors duration-200 hover:border-primary/35 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-tr from-violet-500/[0.07] to-transparent" />
              <div className="relative flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-md bg-muted flex items-center justify-center border border-border/60 ${update.color}`}
                >
                  <update.icon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">{update.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {update.change && (
                      <span className="text-xs font-semibold text-emerald-500">{update.change}</span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {update.time}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity duration-200 shrink-0 mt-0.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <Dialog open={intelOpen} onOpenChange={handleIntelOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-0 text-zinc-50 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_28px_56px_-16px_rgba(0,0,0,0.92),0_0_80px_-24px_rgba(139,92,246,0.28)] backdrop-blur-xl duration-100 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-md ring-1 ring-inset ring-white/[0.07]"
          overlayClassName="duration-150 bg-zinc-950/88 backdrop-blur-lg backdrop-saturate-150"
        >
          <DialogClose
            type="button"
            aria-label="Close"
            className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/90 text-zinc-300 opacity-100 shadow-inner shadow-black/20 transition-[color,background-color,border-color,transform] hover:border-white/20 hover:bg-zinc-800 hover:text-white active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none [&_svg]:pointer-events-none [&_svg]:size-[18px]"
          >
            <X strokeWidth={2.25} />
            <span className="sr-only">Close</span>
          </DialogClose>

          {selectedIntel && (
            <div className="px-6 pb-6 pt-6">
              <DialogHeader className="gap-0 space-y-0 text-left pr-14">
                <DialogTitle className="text-balance border-b border-white/10 pb-4 text-xl font-bold leading-snug tracking-tight text-zinc-50">
                  {selectedIntel.text}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 pb-5 pt-3 text-xs font-medium text-zinc-400">
                  {selectedIntel.change && (
                    <span className="font-semibold text-emerald-400">{selectedIntel.change}</span>
                  )}
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Clock className="size-3.5 shrink-0" aria-hidden />
                    {selectedIntel.time}
                  </span>
                </div>
              </DialogHeader>
              <DialogDescription asChild>
                <div className="space-y-3 border-t border-white/[0.07] pt-5 text-[15px] leading-[1.65] text-zinc-200">
                  {selectedIntel.insights.map((paragraph, i) => (
                    <p key={i} className="text-pretty">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </DialogDescription>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recent Outreach */}
      <motion.div
        initial={isMobile ? false : { opacity: 0, y: 20 }}
        animate={isMobile ? undefined : { opacity: 1, y: 0 }}
        transition={isMobile ? undefined : cardMotionTransition}
        className="rounded-2xl glass-panel border border-border/60 p-4 will-change-transform"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Outreach</h3>
          <button type="button" className="text-xs text-primary hover:underline">
            View All
          </button>
        </div>

        <div className="space-y-3">
          {recentOutreach.map((supplier) => (
            <motion.div
              key={supplier.id}
              initial={isMobile ? false : { opacity: 0, y: 20 }}
              animate={isMobile ? undefined : { opacity: 1, y: 0 }}
              transition={isMobile ? undefined : { duration: 0.2, delay: 0 }}
              whileHover={
                isMobile
                  ? undefined
                  : { scale: 1.02, boxShadow: CARD_HOVER_SHADOW }
              }
              whileTap={{ scale: 0.99 }}
              className="relative flex items-center gap-3 rounded-xl border border-transparent bg-secondary/40 hover:bg-secondary/55 hover:border-primary/25 p-2 cursor-pointer touch-manipulation transition-colors duration-200 overflow-hidden group"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-tr from-violet-500/[0.06] to-transparent" />
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-background shrink-0">
                <Image src={supplier.avatar} alt={supplier.name} fill className="object-cover" />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{supplier.name}</p>
              </div>
              <span
                className={`relative px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${supplier.statusColor}`}
              >
                {supplier.status}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Supplier Avatars Stack */}
        <div className="flex items-center mt-4 pt-4 border-t border-border">
          <div className="flex -space-x-2">
            {recentOutreach.map((supplier) => (
              <div
                key={supplier.id}
                className="relative w-8 h-8 rounded-full border-2 border-card overflow-hidden"
              >
                <Image src={supplier.avatar} alt={supplier.name} fill className="object-cover" />
              </div>
            ))}
          </div>
          <span className="ml-3 text-xs text-muted-foreground">+12 more suppliers</span>
        </div>
      </motion.div>
    </aside>
  )
}
