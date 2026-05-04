"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  CheckCircle2,
  FlaskConical,
  Globe2,
  Lock,
  PenLine,
  ScanLine,
  Sparkles,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"

/* —— Glass surface: light + dark (matches dashboard theme) —— */
const glass = cn(
  "rounded-2xl border backdrop-blur-md",
  "border-black/5 bg-white/70",
  "shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_28px_rgba(15,23,42,0.06)]",
  "dark:border-white/10 dark:bg-black/40",
  "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.06),0_8px_40px_rgba(15,23,42,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]"
)

const webhookLines = [
  "[14:22:01] order.created      id=#9921 channel=storefront",
  "[14:22:04] webhook.receipt    sig=sha256 HMAC valid",
  "[14:23:12] inventory.sync     skus_delta=+42",
  "[14:24:55] product.updated    handle=ultra-mesh-tee",
  "[14:25:33] fulfillment.hold   reason=address_verify",
  "[14:26:01] ai.pipeline.start  model=vision-pro-v2",
  "[14:26:48] ai.pipeline.end    latency_ms=842",
  "[14:27:19] competitor.price   delta=-3.2% vs median",
  "[14:28:07] rate_limit         bucket=ok burst=820",
  "[14:29:51] session.seal       vault=locked",
]

const models = [
  {
    pid: "m1",
    name: "Vision Pro v2",
    tag: "Multimodal",
    icon: ScanLine,
    detail: "Listing QA, packshots, and creative scoring.",
  },
  {
    pid: "m2",
    name: "Market Predictor",
    tag: "Forecast",
    icon: Activity,
    detail: "Elasticity, demand bands, and seasonality hints.",
  },
  {
    pid: "m3",
    name: "Copywriter GPT",
    tag: "Language",
    icon: PenLine,
    detail: "PDP copy, hooks, and platform-safe variants.",
  },
] as const

const automationRows = [
  { id: "ig", label: "Auto-post to Instagram", sub: "Stories + product drops" },
  { id: "stk", label: "Stock Alert AI", sub: "Slack + email digests" },
  { id: "px", label: "Competitor Price Tracking", sub: "Hourly crawl, delta alerts" },
] as const

function neonGlow(active: boolean) {
  return active
    ? cn(
        "border-violet-500/35 shadow-md shadow-violet-500/15 dark:border-violet-400/45",
        "dark:shadow-[0_0_28px_rgba(139,92,246,0.55),0_0_60px_rgba(99,102,241,0.25),inset_0_0_30px_rgba(99,102,241,0.08)]"
      )
    : ""
}

function sectionEnter(delay: number) {
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  } as const
}

function ParticleBackdrop() {
  const pts = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        k: i,
        l: `${(i * 19 + (i % 5) * 11) % 100}%`,
        t: `${(i * 29 + (i % 7) * 7) % 100}%`,
        s: 1 + (i % 3),
        d: (i % 10) * 0.2,
        du: 8 + (i % 9),
      })),
    []
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pts.map((p) => (
        <motion.span
          key={p.k}
          className={cn(
            "absolute rounded-full bg-violet-400/25 shadow-sm shadow-violet-400/20",
            "dark:bg-indigo-400/30 dark:shadow-[0_0_14px_rgba(129,140,248,0.45)]"
          )}
          style={{ left: p.l, top: p.t, width: p.s, height: p.s }}
          animate={{ opacity: [0.15, 0.75, 0.15], y: [0, -14, 0] }}
          transition={{
            duration: p.du,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: p.d,
          }}
        />
      ))}
    </div>
  )
}

function ShopifyBadge({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "")
  const g = `sg-${id}`
  return (
    <svg viewBox="0 0 56 56" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={g} x1="8" y1="10" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#65a30d" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="46" height="46" rx="14" fill={`url(#${g})}`} opacity={0.95} />
      <path
        d="M28 18c-3.5 0-6 2.6-6.5 5.8L20 34h3.2l1.2-7c0.2-1.2 1.1-2.1 2.2-2.1 1.3 0 2.2 1.1 2.2 2.5V38h3.2V26.5c0-4.2-2.8-6.8-6.2-6.8z"
        fill="white"
        fillOpacity={0.95}
      />
      <path d="M33 38h3.2V23.2H33V38z" fill="white" fillOpacity={0.92} />
    </svg>
  )
}

function CustomNeonSwitch({
  on,
  onToggle,
  ariaLabel,
}: {
  on: boolean
  onToggle: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={onToggle}
      className={cn(
        "relative h-8 w-[3.25rem] shrink-0 rounded-full border transition-colors duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        on
          ? cn(
              "border-violet-400/40 bg-gradient-to-r from-violet-100/90 to-indigo-100/80 shadow-md shadow-violet-500/20",
              "dark:border-cyan-400/35 dark:from-violet-950/90 dark:to-indigo-950/80",
              "dark:shadow-[0_0_22px_rgba(139,92,246,0.5),0_0_40px_rgba(59,130,246,0.2)]"
            )
          : "border-black/10 bg-black/[0.06] dark:border-white/12 dark:bg-black/55"
      )}
    >
      <motion.span
        layout
        className={cn(
          "absolute top-0.5 left-0.5 h-7 w-7 rounded-full border",
          "border-black/5 dark:border-white/10",
          on
            ? cn(
                "bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 shadow-md shadow-violet-400/35",
                "dark:from-violet-300 dark:via-indigo-400 dark:to-blue-500 dark:shadow-[0_0_16px_rgba(167,139,250,0.95)]"
              )
            : "bg-muted dark:bg-zinc-700/90"
        )}
        animate={{ x: on ? 22 : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      />
    </button>
  )
}

function RadialMetricSvg({ pct }: { pct: number }) {
  const r = 58
  const cx = 72
  const cy = 72
  const C = 2 * Math.PI * r
  const off = C * (1 - pct / 100)
  const gradId = useId().replace(/:/g, "")
  const ringGrad = `ring-grad-${gradId}`

  return (
    <div className="relative mx-auto h-[200px] w-[200px]">
      <svg
        width="200"
        height="200"
        viewBox="0 0 144 144"
        className="drop-shadow-md drop-shadow-violet-500/10 dark:drop-shadow-[0_0_24px_rgba(99,102,241,0.35)]"
      >
        <defs>
          <linearGradient id={ringGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="stroke-muted-foreground/25 dark:stroke-white/[0.08]"
          strokeWidth="14"
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${ringGrad})`}
          strokeWidth="14"
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-semibold tabular-nums text-foreground"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          {pct}%
        </motion.span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground dark:text-violet-200/70">
          Neural load
        </span>
      </div>
    </div>
  )
}

function SparklineSvg({ values }: { values: number[] }) {
  const w = 220
  const h = 72
  const pad = 6
  const strokeId = useId().replace(/:/g, "")
  const gradRef = `spark-stroke-${strokeId}`
  const d = useMemo(() => {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const rng = max - min || 1
    const iw = w - pad * 2
    const ih = h - pad * 2
    return values
      .map((v, i) => {
        const x = pad + (iw * i) / Math.max(1, values.length - 1)
        const y = pad + ih - ((v - min) / rng) * ih
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(" ")
  }, [values])

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradRef} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <motion.path
        d={d}
        fill="none"
        stroke={`url(#${gradRef})`}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 1.4, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.35 } }}
      />
    </svg>
  )
}

export default function LabPage() {
  const [search, setSearch] = useState("")

  const [storeUrl, setStoreUrl] = useState("")
  const [connect, setConnect] = useState<"idle" | "running" | "done">("idle")
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  const startConnect = useCallback(() => {
    if (connect === "running") return
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    setConnect("running")
    setProgress(0)
    const t0 = performance.now()
    const dur = 3000
    const frame = (now: number) => {
      const p = Math.min(100, ((now - t0) / dur) * 100)
      setProgress(p)
      if (p < 100) rafRef.current = requestAnimationFrame(frame)
      else {
        rafRef.current = null
        setConnect("done")
      }
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [connect])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const logRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = logRef.current
    if (!el) return
    let y = 0
    let f = 0
    const step = () => {
      const half = el.scrollHeight / 2
      if (half > 6) {
        y += 0.35
        if (y >= half) y = 0
        el.scrollTop = y
      }
      f = requestAnimationFrame(step)
    }
    f = requestAnimationFrame(step)
    return () => cancelAnimationFrame(f)
  }, [])

  const [pick, setPick] = useState<string>(models[0].pid)
  const [sw, setSw] = useState<Record<string, boolean>>({ ig: false, stk: true, px: true })
  const toggleSw = (k: string) => setSw((s) => ({ ...s, [k]: !s[k] }))

  const [vaultHover, setVaultHover] = useState(false)
  const [vaultPin, setVaultPin] = useState(false)
  const clearVaultBlur = vaultHover || vaultPin

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <Header searchQuery={search} onSearchChange={setSearch} />

      <main className="relative z-10 min-h-screen pl-[var(--content-offset,0px)] pt-16">
        <div className="relative mx-auto max-w-[1600px] px-4 py-5 md:px-6 md:py-6">
          <ParticleBackdrop />

          <div className="relative z-10 flex flex-col gap-6 md:gap-8">
            <motion.header {...sectionEnter(0)} className="flex flex-wrap items-center gap-3">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-md",
                  "border-black/5 bg-white/70 shadow-md shadow-violet-500/10",
                  "dark:border-white/10 dark:bg-black/40 dark:shadow-[0_0_32px_rgba(99,102,241,0.35)]"
                )}
              >
                <FlaskConical className="h-6 w-6 text-violet-600 dark:text-violet-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Control Lab</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Full mock control surface — Shopify bridge, feeds, models, automation, telemetry, and vault.
                </p>
              </div>
            </motion.header>

            {/* 1 + 2 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              <motion.section
                {...sectionEnter(0.04)}
                whileHover={{ y: -3 }}
                className={cn(glass, "p-5 md:p-6 md:col-span-2 lg:col-span-2", neonGlow(false))}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <motion.div
                    animate={{
                      filter: [
                        "drop-shadow(0 0 6px rgba(34,197,94,0.15))",
                        "drop-shadow(0 0 16px rgba(34,197,94,0.38))",
                        "drop-shadow(0 0 6px rgba(34,197,94,0.15))",
                      ],
                    }}
                    transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <ShopifyBadge className="h-16 w-16 md:h-[4.5rem] md:w-[4.5rem]" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">Shopify Bridge</h2>
                      <Globe2 className="h-4 w-4 text-violet-600 dark:text-violet-300/80" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Connect flow — progress runs 3s, then success (mock only).
                    </p>
                    <label className="mt-4 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Store URL
                    </label>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        value={storeUrl}
                        onChange={(e) => setStoreUrl(e.target.value)}
                        placeholder="your-store.myshopify.com"
                        className={cn(
                          "h-11 w-full flex-1 rounded-xl border px-3 text-sm outline-none backdrop-blur-md",
                          "border-black/10 bg-white/80 text-foreground placeholder:text-muted-foreground",
                          "focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15",
                          "dark:border-white/10 dark:bg-black/40 dark:text-white dark:placeholder:text-zinc-500",
                          "dark:focus:border-violet-400/40 dark:focus:ring-violet-500/20"
                        )}
                      />
                      <motion.button
                        type="button"
                        disabled={connect === "running"}
                        onClick={startConnect}
                        whileHover={{ scale: connect === "running" ? 1 : 1.02 }}
                        whileTap={{ scale: connect === "running" ? 1 : 0.98 }}
                        className={cn(
                          "h-11 shrink-0 rounded-xl px-5 text-sm font-medium backdrop-blur-md",
                          "border border-violet-500/35 bg-gradient-to-r from-violet-600 to-indigo-600 text-white",
                          "shadow-md shadow-violet-500/25 dark:shadow-[0_0_24px_rgba(139,92,246,0.45)]",
                          "disabled:opacity-60"
                        )}
                      >
                        {connect === "running" ? "Connecting…" : connect === "done" ? "Reconnect" : "Connect"}
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {connect !== "idle" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-2 overflow-hidden"
                        >
                          <div className="h-2 w-full overflow-hidden rounded-full border border-black/10 bg-black/[0.06] dark:border-white/10 dark:bg-black/50">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400"
                              initial={{ width: "0%" }}
                              animate={{ width: `${progress}%` }}
                              transition={{ ease: "linear", duration: 0 }}
                            />
                          </div>
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {connect === "running" ? `Tunnel ${Math.round(progress)}%` : "Handshake complete"}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {connect === "done" && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-300"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          >
                            <CheckCircle2 className="h-6 w-6 drop-shadow-sm drop-shadow-emerald-500/30 dark:drop-shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
                          </motion.div>
                          <span className="text-sm font-medium text-foreground">Connected successfully (mock)</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.section>

              <motion.section
                {...sectionEnter(0.07)}
                whileHover={{ y: -3 }}
                className={cn(glass, "flex min-h-[300px] flex-col p-5 md:p-6 md:col-span-2 lg:col-span-1")}
              >
                <div className="mb-3 flex items-center gap-2 border-b border-black/5 pb-3 dark:border-white/10">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/90 shadow-sm shadow-red-400/30 dark:shadow-[0_0_8px_rgba(248,113,113,0.7)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90 shadow-sm shadow-amber-400/25 dark:shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90 shadow-sm shadow-emerald-400/25 dark:shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    webhook_feed — live (sim)
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-foreground">Webhook Monitor</h2>
                <p className="mt-1 text-xs text-muted-foreground">Auto-scrolling event buffer</p>
                <div
                  ref={logRef}
                  className={cn(
                    "mt-3 min-h-[200px] flex-1 overflow-hidden rounded-xl border px-3 py-2 font-mono text-[10px] leading-relaxed sm:text-[11px]",
                    "border-cyan-600/15 bg-white/55 text-foreground shadow-inner shadow-cyan-500/5",
                    "dark:border-cyan-500/15 dark:bg-black/55 dark:text-cyan-200/90 dark:shadow-[inset_0_0_24px_rgba(34,211,238,0.06)]"
                  )}
                >
                  <ul className="space-y-1">
                    {[...webhookLines, ...webhookLines].map((line, i) => (
                      <li
                        key={`${i}-${line}`}
                        className={cn(
                          i % 2 === 0
                            ? "text-emerald-700 dark:text-emerald-300/95 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]"
                            : "text-violet-700 dark:text-violet-300/95 dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.35)]"
                        )}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.section>
            </div>

            {/* 3 — AI */}
            <motion.section {...sectionEnter(0.09)} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">AI Model Selector</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  One active glass card — violet glow on selection.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                {models.map((m, i) => {
                  const Icon = m.icon
                  const on = pick === m.pid
                  return (
                    <motion.div key={m.pid} {...sectionEnter(0.05 + i * 0.04)}>
                      <motion.button
                        type="button"
                        onClick={() => setPick(m.pid)}
                        whileHover={{ y: -6, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "w-full rounded-2xl border p-5 text-left backdrop-blur-md md:p-6",
                          "border-black/5 bg-white/70 transition-shadow duration-300",
                          "dark:border-white/10 dark:bg-black/40",
                          on &&
                            cn(
                              "border-violet-500/45 shadow-lg shadow-violet-500/15 ring-1 ring-violet-400/25",
                              "dark:border-violet-400/60 dark:shadow-[0_0_36px_rgba(167,139,250,0.45),0_0_80px_rgba(99,102,241,0.2),inset_0_0_40px_rgba(99,102,241,0.08)] dark:ring-0"
                            )
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm",
                              "border-black/5 bg-violet-100/80 shadow-violet-500/10",
                              "dark:border-white/10 dark:bg-indigo-500/10 dark:shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                            )}
                          >
                            <Icon className="h-5 w-5 text-violet-700 dark:text-indigo-200" />
                          </span>
                          <span
                            className={cn(
                              "rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
                              on
                                ? "border-violet-500/35 bg-violet-100/80 text-violet-800 dark:border-violet-400/50 dark:bg-violet-500/15 dark:text-violet-200"
                                : "border-black/5 text-muted-foreground dark:border-white/10"
                            )}
                          >
                            {on ? "Selected" : "Select"}
                          </span>
                        </div>
                        <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-cyan-800 dark:text-cyan-200/70">
                          {m.tag}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-foreground">{m.name}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{m.detail}</p>
                      </motion.button>
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>

            {/* 4 — 6 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              <motion.section
                {...sectionEnter(0.11)}
                whileHover={{ y: -3 }}
                className={cn(glass, "p-5 md:p-6 md:col-span-2 lg:col-span-1")}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  <h2 className="text-lg font-semibold text-foreground">Automation Dashboard</h2>
                </div>
                <p className="mb-5 text-xs text-muted-foreground">Custom neon switches — grid layout.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                  {automationRows.map((row) => (
                    <div
                      key={row.id}
                      className={cn(
                        "flex items-center justify-between gap-4 rounded-xl border px-4 py-3 backdrop-blur-sm",
                        "border-black/5 bg-white/50 dark:border-white/5 dark:bg-black/30"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{row.label}</p>
                        <p className="text-[11px] text-muted-foreground">{row.sub}</p>
                      </div>
                      <CustomNeonSwitch
                        on={sw[row.id]}
                        onToggle={() => toggleSw(row.id)}
                        ariaLabel={`${row.label} automation`}
                      />
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section
                {...sectionEnter(0.13)}
                whileHover={{ y: -3 }}
                className={cn(glass, "p-5 md:p-6")}
              >
                <h2 className="text-lg font-semibold text-foreground">SVG Analytics</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Radial load + animated sparkline (no chart libs).
                </p>
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-center">
                  <RadialMetricSvg pct={42} />
                  <div
                    className={cn(
                      "rounded-xl border p-3 backdrop-blur-sm",
                      "border-black/5 bg-white/60 dark:border-white/10 dark:bg-black/35"
                    )}
                  >
                    <SparklineSvg values={[7, 11, 9, 14, 12, 10, 15]} />
                    <p className="mt-1 text-center text-[11px] font-medium text-cyan-800 tabular-nums dark:text-cyan-200/90">
                      API latency · 12ms (mock)
                    </p>
                  </div>
                </div>
              </motion.section>

              <motion.section
                {...sectionEnter(0.15)}
                whileHover={{ y: -3 }}
                className={cn(
                  glass,
                  "relative min-w-0 overflow-hidden p-5 md:p-6 md:col-span-2 lg:col-span-1",
                  "shadow-md shadow-amber-500/10 dark:border-amber-500/20 dark:shadow-[0_0_40px_rgba(251,191,36,0.08)]"
                )}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-indigo-600/[0.06] dark:from-amber-500/10 dark:to-indigo-600/10" />
                <div className="relative min-w-0">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                    <h2 className="text-lg font-semibold tracking-wide text-foreground">Security Vault</h2>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-amber-800/70 dark:text-amber-200/60">
                    Classified key · mock
                  </p>

                  <motion.div
                    onMouseEnter={() => setVaultHover(true)}
                    onMouseLeave={() => setVaultHover(false)}
                    onClick={() => setVaultPin((p) => !p)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setVaultPin((p) => !p)
                      }
                    }}
                    className={cn(
                      "mt-4 w-full max-w-full min-w-0 cursor-pointer rounded-xl border p-4 backdrop-blur-md outline-none",
                      "border-black/10 bg-white/55 shadow-inner shadow-black/[0.03]",
                      "focus-visible:ring-2 focus-visible:ring-amber-500/35 dark:border-white/10 dark:bg-black/45",
                      "dark:focus-visible:ring-amber-400/40 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    )}
                  >
                    <p className="text-[10px] text-muted-foreground">API key</p>
                    <p
                      className={cn(
                        "mt-2 w-full max-w-full select-none break-all break-words whitespace-pre-wrap font-mono text-xs leading-relaxed transition-[filter] duration-300 sm:text-sm",
                        "text-foreground",
                        clearVaultBlur ? "blur-none" : "blur-[8px]"
                      )}
                    >
                      sk_live_ecom_sec_9f2a7c1e4b8d0a6f3c5e7b9d2a4f8c0e
                    </p>
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      Hover or click to reveal. Click again to hide when not hovering.
                    </p>
                  </motion.div>
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
