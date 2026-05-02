"use client"

import { motion } from "framer-motion"
import { TrendingUp, Zap, Flame } from "lucide-react"
import { useAiCredits } from "@/hooks/use-ai-credits"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts"

const sparklineData = [
  { value: 65 },
  { value: 72 },
  { value: 68 },
  { value: 85 },
  { value: 78 },
  { value: 92 },
  { value: 88 },
  { value: 95 },
]

export function StatCards() {
  const { credits, maxCredits } = useAiCredits()
  const isMobile = useIsMobile()
  const usedPct = Math.round(((maxCredits - credits) / maxCredits) * 100)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Global Win-Rate */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={isMobile ? undefined : { scale: 1.02, boxShadow: "0 14px 28px rgba(2, 6, 23, 0.35)" }}
        whileTap={{ scale: 0.995 }}
        className="relative p-5 rounded-xl glass-panel border border-primary/20 overflow-hidden group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-xs text-emerald-500 font-medium">+12.5%</span>
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-1">87.4%</h3>
        <p className="text-sm text-muted-foreground">Global Win-Rate</p>
        
        {/* Sparkline */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-50">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22C55E"
                strokeWidth={2}
                fill="url(#greenGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none glow-green rounded-xl" />
      </motion.div>

      {/* AI Intelligence Credits */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={isMobile ? undefined : { scale: 1.02, boxShadow: "0 14px 28px rgba(2, 6, 23, 0.35)" }}
        whileTap={{ scale: 0.995 }}
        className="relative p-5 rounded-xl glass-panel border border-primary/20 overflow-hidden group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-primary font-medium">{usedPct}% used</span>
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-1">{credits}<span className="text-lg text-muted-foreground">/{maxCredits}</span></h3>
        <p className="text-sm text-muted-foreground">AI Intelligence Credits</p>
        
        {/* Progress bar */}
        <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usedPct}%` }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400"
          />
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none glow-violet rounded-xl" />
      </motion.div>

      {/* Market Heatmap Status */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={isMobile ? undefined : { scale: 1.02, boxShadow: "0 14px 28px rgba(2, 6, 23, 0.35)" }}
        whileTap={{ scale: 0.995 }}
        className="relative p-5 rounded-xl glass-panel border border-primary/20 overflow-hidden group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <motion.span
            animate={isMobile ? undefined : { opacity: [1, 0.5, 1] }}
            transition={isMobile ? undefined : { duration: 1.5, repeat: Infinity }}
            className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500/20 text-orange-500"
          >
            HOT
          </motion.span>
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-1">Market Heatmap</h3>
        <p className="text-sm text-muted-foreground">3 niches trending now</p>
        
        {/* Heat indicator bars */}
        <div className="mt-4 flex gap-1">
          {[0.9, 0.7, 0.5, 0.3, 0.2].map((opacity, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full"
              style={{
                background: `rgba(249, 115, 22, ${opacity})`,
              }}
            />
          ))}
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none glow-orange rounded-xl" />
      </motion.div>
    </div>
  )
}
