"use client"

import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Package, Clock, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"

const liveUpdates = [
  {
    id: 1,
    icon: TrendingUp,
    text: "Portable Heater spiking in UK",
    change: "+140%",
    time: "2m ago",
    color: "text-emerald-500",
  },
  {
    id: 2,
    icon: Package,
    text: "New supplier found for 'Orthopedic Pillow'",
    change: null,
    time: "5m ago",
    color: "text-primary",
  },
  {
    id: 3,
    icon: TrendingUp,
    text: "Galaxy Projector viral on TikTok",
    change: "+89%",
    time: "12m ago",
    color: "text-emerald-500",
  },
  {
    id: 4,
    icon: TrendingUp,
    text: "Smart Bottle trending in Germany",
    change: "+67%",
    time: "18m ago",
    color: "text-emerald-500",
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

  return (
    <aside className="w-full h-full flex flex-col gap-4">
      {/* AI Live Intelligence */}
      <motion.div
        initial={isMobile ? false : { x: 20, opacity: 0 }}
        animate={isMobile ? undefined : { x: 0, opacity: 1 }}
        className="rounded-2xl glass-panel soft-hover p-4 flex-1"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">AI Live Intelligence</h3>
          <motion.div
            animate={isMobile ? undefined : { scale: [1, 1.2, 1] }}
            transition={isMobile ? undefined : { duration: 2, repeat: Infinity }}
            className="ml-auto w-2 h-2 rounded-full bg-emerald-500"
          />
        </div>

        <div className="space-y-3">
          {liveUpdates.map((update, index) => (
            <motion.div
              key={update.id}
              initial={isMobile ? false : { x: 20, opacity: 0 }}
              animate={isMobile ? undefined : { x: 0, opacity: 1 }}
              transition={isMobile ? undefined : { delay: 0.1 * index }}
              whileHover={isMobile ? undefined : { x: 4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300 cursor-pointer group border border-transparent hover:border-primary/25"
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-md bg-muted flex items-center justify-center ${update.color}`}>
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
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Outreach */}
      <motion.div
        initial={isMobile ? false : { x: 20, opacity: 0 }}
        animate={isMobile ? undefined : { x: 0, opacity: 1 }}
        transition={isMobile ? undefined : { delay: 0.2 }}
        className="rounded-2xl glass-panel soft-hover p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Outreach</h3>
          <button className="text-xs text-primary hover:underline">View All</button>
        </div>

        <div className="space-y-3">
          {recentOutreach.map((supplier, index) => (
            <motion.div
              key={supplier.id}
              initial={isMobile ? false : { x: 20, opacity: 0 }}
              animate={isMobile ? undefined : { x: 0, opacity: 1 }}
              transition={isMobile ? undefined : { delay: 0.3 + 0.1 * index }}
              whileHover={isMobile ? undefined : { x: 4, scale: 1.01 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-all duration-300 cursor-pointer"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={supplier.avatar}
                  alt={supplier.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{supplier.name}</p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${supplier.statusColor}`}>
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
                <Image
                  src={supplier.avatar}
                  alt={supplier.name}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <span className="ml-3 text-xs text-muted-foreground">+12 more suppliers</span>
        </div>
      </motion.div>
    </aside>
  )
}
