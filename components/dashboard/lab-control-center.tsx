"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Eye, FlaskConical, Globe2, Lock, PenLine, ScanLine } from "lucide-react"
import {
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const webhookLogs = [
  "[14:22] Order #9921 Received",
  "[14:23] Webhook verified (HMAC)",
  "[14:24] Product cache warmed",
  "[14:25] Inventory Synced",
  "[14:27] Competitor crawl queued",
  "[14:28] Fulfillment status pushed",
  "[14:30] AI Analysis Complete",
  "[14:31] Summary digest emitted",
  "[14:33] Rate limit: OK",
  "[14:35] Session signed — vault sealed",
]

const aiModels = [
  {
    id: "vision",
    title: "Vision Pro v2",
    desc: "Creative scoring & listing imagery QA",
    icon: ScanLine,
  },
  {
    id: "market",
    title: "Market Predictor",
    desc: "Demand signals & elasticity modeling",
    icon: Activity,
  },
  {
    id: "copy",
    title: "Copywriter GPT",
    desc: "Brand tone, PDPs, and ad variants",
    icon: PenLine,
  },
] as const

const latencyData = [
  { t: "00:00", ms: 8 },
  { t: "00:15", ms: 11 },
  { t: "00:30", ms: 9 },
  { t: "00:45", ms: 14 },
  { t: "01:00", ms: 12 },
]

const radialData = [{ name: "neural", value: 42, fill: "#8b5cf6" }]

function ParticleField() {
  const dots = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + (i % 7) * 13) % 100}%`,
        top: `${(i * 23 + (i % 5) * 19) % 100}%`,
        size: 1 + (i % 3),
        delay: (i % 12) * 0.25,
        duration: 10 + (i % 8),
      })),
    []
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-primary/35"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            boxShadow: "0 0 12px rgba(139, 92, 246, 0.35)",
          }}
          animate={{ opacity: [0.2, 0.85, 0.2], y: [0, -18, 0] }}
          transition={{
            duration: d.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: d.delay,
          }}
        />
      ))}
    </div>
  )
}

function sectionMotionProps(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-48px" },
    transition: { duration: 0.45, delay },
  } as const
}

function ShopifyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="shopGlow" x1="8" y1="8" x2="44" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7CB342" />
          <stop offset="1" stopColor="#43A047" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="12"
        fill="url(#shopGlow)"
        filter="url(#glow)"
        opacity="0.95"
      />
      <path
        d="M24 14c-3.2 0-5.5 2.4-6 5.4l-1.4 8.2h3l1.1-6.5c0.2-1.1 1-1.9 2-1.9 1.2 0 2 1 2 2.3V32h3V22c0-3.9-2.6-6-5.7-6z"
        fill="white"
        fillOpacity="0.95"
      />
      <path d="M28.5 32h3V18.5h-3V32z" fill="white" fillOpacity="0.92" />
    </svg>
  )
}

export function LabControlCenter() {
  const [storeUrl, setStoreUrl] = useState("")
  const [connectPhase, setConnectPhase] = useState<"idle" | "connecting" | "connected">("idle")
  const [connectProgress, setConnectProgress] = useState(0)

  const [selectedModel, setSelectedModel] = useState<string>(aiModels[0].id)
  const [autoPost, setAutoPost] = useState(false)
  const [stockAlert, setStockAlert] = useState(true)
  const [priceTrack, setPriceTrack] = useState(true)

  const [vaultRevealed, setVaultRevealed] = useState(false)
  const [lockPulse, setLockPulse] = useState(false)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logScrollRef = useRef<HTMLDivElement | null>(null)
  const connectRafRef = useRef<number | null>(null)

  const runConnect = useCallback(() => {
    if (connectPhase === "connecting") return
    if (connectRafRef.current != null) cancelAnimationFrame(connectRafRef.current)
    setConnectPhase("connecting")
    setConnectProgress(0)
    const started = performance.now()
    const duration = 3000
    const tick = (now: number) => {
      const p = Math.min(100, ((now - started) / duration) * 100)
      setConnectProgress(p)
      if (p < 100) {
        connectRafRef.current = requestAnimationFrame(tick)
      } else {
        connectRafRef.current = null
        setConnectPhase("connected")
      }
    }
    connectRafRef.current = requestAnimationFrame(tick)
  }, [connectPhase])

  useEffect(() => {
    return () => {
      if (connectRafRef.current != null) cancelAnimationFrame(connectRafRef.current)
    }
  }, [])

  useEffect(() => {
    const el = logScrollRef.current
    if (!el) return
    let y = 0
    let frame: number
    const speed = 0.35
    const step = () => {
      y += speed
      const max = el.scrollHeight / 2
      if (y >= max) y = 0
      el.scrollTop = y
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [])

  const toggleVault = useCallback(() => {
    setLockPulse(true)
    window.setTimeout(() => setLockPulse(false), 500)
    if (revealTimer.current) clearTimeout(revealTimer.current)
    setVaultRevealed(true)
    revealTimer.current = setTimeout(() => setVaultRevealed(false), 5000)
  }, [])

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current)
    }
  }, [])

  return (
    <div className="relative min-h-full">
      <ParticleField />
      <div className="relative z-10 space-y-6 md:space-y-8">
        <motion.header {...sectionMotionProps(0)} className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 glow-violet">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Control Center</h1>
              <p className="text-sm text-muted-foreground">
                Lab environment — unified bridge, signal feeds, and encrypted operational keys (mock).
              </p>
            </div>
          </div>
        </motion.header>

        {/* Row: Shopify + Webhooks */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.section
            {...sectionMotionProps(0.05)}
            whileHover={{ y: -2 }}
            className={cn(
              "glass-panel rounded-2xl border border-white/10 p-5 md:p-6",
              "md:col-span-2 lg:col-span-2",
              "shadow-[0_0_40px_rgba(139,92,246,0.08)]"
            )}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <ShopifyMark className="h-16 w-16 md:h-20 md:w-20" />
                  <div className="absolute inset-0 -z-10 blur-2xl bg-emerald-500/25 rounded-full scale-125" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Shopify Command Bridge
                    <Globe2 className="h-4 w-4 text-muted-foreground" />
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    Simulated storefront handshake — no real credentials are transmitted.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Store URL
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="your-store.myshopify.com"
                  className="h-11 flex-1 rounded-xl border-white/10 bg-black/30"
                />
                <Button
                  type="button"
                  onClick={runConnect}
                  disabled={connectPhase === "connecting"}
                  className="h-11 rounded-xl glow-violet shadow-lg shrink-0"
                >
                  {connectPhase === "connecting" ? "Simulated Connecting…" : "Connect"}
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {connectPhase !== "idle" && (
                  <motion.div
                    key="prog"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Progress value={connectProgress} className="h-2 bg-primary/15 rounded-full" />
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {connectPhase === "connecting"
                        ? `Establishing tunnel… ${Math.round(connectProgress)}%`
                        : "Handshake complete"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {connectPhase === "connected" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-2 pt-1"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  </span>
                  <span className="text-sm font-medium text-emerald-300">Status: Connected (Mock)</span>
                </motion.div>
              )}
            </div>
          </motion.section>

          <motion.section
            {...sectionMotionProps(0.08)}
            whileHover={{ y: -2 }}
            className={cn(
              "glass-panel rounded-2xl border border-white/10 p-5 md:p-6 md:col-span-2 lg:col-span-1",
              "min-h-[280px] flex flex-col"
            )}
          >
            <h2 className="text-lg font-semibold text-foreground mb-1">Real-Time Webhook Monitor</h2>
            <p className="text-xs text-muted-foreground mb-4">Live relay stream (simulated)</p>
            <div
              ref={logScrollRef}
              className="flex-1 min-h-[200px] rounded-xl border border-emerald-500/15 bg-black/40 px-3 py-2 overflow-hidden font-mono text-[11px] sm:text-xs leading-relaxed"
            >
              <ul className="space-y-1.5">
                {[...webhookLogs, ...webhookLogs].map((line, i) => (
                  <li
                    key={`${line}-${i}`}
                    className={cn(
                      "font-mono",
                      i % 2 === 0
                        ? "text-emerald-400/95 drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]"
                        : "text-purple-300/95 drop-shadow-[0_0_10px_rgba(167,139,250,0.4)]"
                    )}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>
        </div>

        {/* AI Model Lab */}
        <motion.section {...sectionMotionProps(0.1)} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Model Lab</h2>
            <p className="text-sm text-muted-foreground mt-1">Select the active inference stack for this session.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {aiModels.map((m, idx) => {
              const Icon = m.icon
              const active = selectedModel === m.id
              return (
                <motion.button
                  type="button"
                  key={m.id}
                  {...sectionMotionProps(0.04 + idx * 0.04)}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedModel(m.id)}
                  className={cn(
                    "glass-panel rounded-2xl border p-5 md:p-6 text-left transition-shadow duration-300",
                    "border-white/10 bg-black/20",
                    active &&
                      "border-primary/70 shadow-[0_0_28px_rgba(139,92,246,0.45),inset_0_0_0_1px_rgba(167,139,250,0.35)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-lg border",
                        active
                          ? "border-primary/50 text-primary bg-primary/10"
                          : "border-white/10 text-muted-foreground"
                      )}
                    >
                      {active ? "Selected" : "Select"}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{m.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-snug">{m.desc}</p>
                </motion.button>
              )
            })}
          </div>
        </motion.section>

        {/* Automation · Analytics · Vault */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <motion.section
            {...sectionMotionProps(0.06)}
            whileHover={{ y: -2 }}
            className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6 md:col-span-2 lg:col-span-1"
          >
            <h2 className="text-lg font-semibold text-foreground mb-1">Automation Switchboard</h2>
            <p className="text-xs text-muted-foreground mb-5">Route high-leverage jobs without leaving the bridge.</p>
            <ul className="space-y-5">
              {[
                { label: "Auto-post to Instagram", checked: autoPost, onCheckedChange: setAutoPost },
                { label: "Stock Alert AI", checked: stockAlert, onCheckedChange: setStockAlert },
                { label: "Competitor Price Tracking", checked: priceTrack, onCheckedChange: setPriceTrack },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-foreground/90">{row.label}</span>
                  <Switch
                    checked={row.checked}
                    onCheckedChange={row.onCheckedChange}
                    className={cn(
                      "scale-110 origin-right",
                      row.checked &&
                        "shadow-[0_0_20px_rgba(139,92,246,0.55),0_0_36px_rgba(99,102,241,0.25)] border border-primary/40"
                    )}
                  />
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section
            {...sectionMotionProps(0.09)}
            whileHover={{ y: -2 }}
            className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-1">System Radius Analytics</h2>
            <p className="text-xs text-muted-foreground mb-4">Mock observability — lines animate on load.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="relative h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="55%"
                    outerRadius="100%"
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      background={{ fill: "rgba(139,92,246,0.12)" }}
                      dataKey="value"
                      cornerRadius={8}
                      isAnimationActive
                      animationDuration={1200}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold tabular-nums text-foreground">42%</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Neural Load</span>
                </div>
              </div>
              <div className="h-40 w-full rounded-xl border border-white/5 bg-black/25 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <Line
                      type="monotone"
                      dataKey="ms"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                      animationDuration={1400}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-[11px] text-emerald-300/90 mt-1 tabular-nums">API Latency: 12ms</p>
              </div>
            </div>
          </motion.section>

          <motion.section
            {...sectionMotionProps(0.12)}
            whileHover={{ y: -2 }}
            className="glass-panel rounded-2xl border border-amber-500/20 p-5 md:p-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-primary/10 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-amber-400/90" />
                <h2 className="text-lg font-semibold text-foreground tracking-wide">Encrypted API Key Vault</h2>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70 mb-4">Top Secret · Mock Key</p>
              <div className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-md p-4 flex items-center gap-3">
                <motion.div
                  animate={lockPulse ? { rotate: [0, -12, 12, 0], scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 0.5 }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-400/25"
                >
                  <Lock className="h-5 w-5 text-amber-300" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground mb-1">Private key</p>
                  <p
                    className={cn(
                      "font-mono text-sm break-all transition-all duration-300 select-none",
                      vaultRevealed ? "blur-none text-foreground" : "blur-md text-muted-foreground"
                    )}
                  >
                    sk_live_ecomflow_mock_7f3c9a2b4d8e1f6c0
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={toggleVault}
                  className="rounded-xl border-white/15 bg-black/40 shrink-0"
                  aria-label={vaultRevealed ? "Hide API key" : "Reveal API key"}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Reveal clears after 5 seconds. Pulse indicates vault session (mock).
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}