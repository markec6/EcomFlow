"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Bot, Sparkles } from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const PARTICLE_COORDS: ReadonlyArray<readonly [number, number, number]> = [
  [8, 12, 0.9],
  [22, 28, 1.4],
  [78, 15, 1.1],
  [92, 35, 0.85],
  [15, 55, 1.25],
  [40, 8, 1.05],
  [55, 48, 1.35],
  [88, 62, 1.15],
  [12, 78, 0.95],
  [35, 88, 1.3],
  [65, 22, 1.2],
  [72, 72, 0.88],
  [48, 38, 1.45],
  [25, 65, 1.1],
  [90, 88, 1.25],
  [5, 45, 0.82],
  [62, 8, 1.08],
  [95, 50, 1.38],
  [18, 92, 1.05],
  [82, 40, 0.92],
]

export function AiNeuralLinkSidebarModal() {
  const reduceMotion = useReducedMotion()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center glow-violet group transition-all duration-300 hover:scale-110 hover:-translate-y-1 touch-manipulation mx-auto"
          aria-label="AI tools"
        >
          <Sparkles className="w-5 h-5 text-white group-hover:animate-pulse" />
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton
        overlayClassName="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-slate-950/55"
        className={cn(
          "z-[210] gap-0 border border-white/10 p-0 text-center shadow-[0_0_60px_-12px_rgba(139,92,246,0.55)] outline-none overflow-hidden supports-[backdrop-filter]:backdrop-blur-2xl",
          "rounded-2xl max-md:rounded-b-3xl max-md:rounded-t-3xl",
          "fixed left-1/2 top-1/2 w-[min(calc(100vw-2rem),28rem)] max-h-[calc(100dvh-3rem)] -translate-x-1/2 -translate-y-1/2",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300",
          "max-md:inset-auto max-md:bottom-4 max-md:top-auto max-md:left-4 max-md:right-4 max-md:h-auto max-md:w-auto max-md:max-h-[85dvh] max-md:translate-x-0 max-md:translate-y-0 max-md:border-b-0",
          "max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:zoom-out-100 max-md:data-[state=open]:zoom-in-100",
          "bg-gradient-to-br from-slate-950/88 via-[#12081f]/90 to-indigo-950/75",
          "sm:max-w-md",
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.07] via-transparent to-cyan-500/[0.06] animate-pulse opacity-70"
          />
          <motion.div
            aria-hidden
            className="absolute inset-0 opacity-[0.12]"
            animate={reduceMotion ? undefined : { opacity: [0.08, 0.18, 0.1] }}
            transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              backgroundImage:
                "repeating-linear-gradient(-12deg, transparent 0px, transparent 3px, rgba(139,92,246,0.25) 3px, rgba(139,92,246,0.25) 4px)",
            }}
          />
          {PARTICLE_COORDS.map(([leftPct, topPct, duration], i) => (
            <motion.span
              key={`${leftPct}-${topPct}-${i}`}
              aria-hidden
              className="absolute h-1 w-1 rounded-full bg-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.9)]"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
              }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.15, 0.85, 0.2],
                      scale: [0.85, 1.35, 0.95],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration,
                      repeat: Infinity,
                      delay: i * 0.12,
                      ease: "easeInOut",
                    }
              }
            />
          ))}
        </div>

        <div className="relative z-10 flex max-h-[85dvh] flex-col px-6 pb-6 pt-9 sm:px-8 sm:pb-8 sm:pt-10 md:max-h-none">
          <div className="mx-auto mb-5 flex shrink-0 items-center justify-center sm:mb-7">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-[-18px] rounded-full bg-gradient-to-br from-primary/55 to-cyan-500/25 blur-xl opacity-80"
              />
              <motion.div
                className="relative flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/35 shadow-inner shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_-4px_rgba(139,92,246,0.55)] sm:h-[5.75rem] sm:w-[5.75rem]"
                animate={reduceMotion ? undefined : { scale: [1, 1.045, 1] }}
                transition={reduceMotion ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bot
                  aria-hidden
                  className="h-12 w-12 text-white sm:h-[3.5rem] sm:w-[3.5rem]"
                  strokeWidth={1.35}
                />
              </motion.div>
            </div>
          </div>

          <DialogTitle className="text-balance text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            AI Neural Link: Initializing...
          </DialogTitle>
          <DialogDescription className="mt-3 text-balance text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
            Our intelligence engine is currently in the gym, getting smarter. We are training the models to
            provide you with the most accurate e-commerce insights. Full AI integration is coming soon.
          </DialogDescription>

          <div className="mt-8 flex shrink-0 flex-col sm:mt-9">
            <DialogClose asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-xl px-8 py-2.5 text-sm font-semibold text-primary-foreground",
                  "touch-manipulation",
                  "bg-gradient-to-r from-primary via-violet-500 to-indigo-600",
                  "shadow-[0_0_22px_-4px_rgba(139,92,246,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]",
                  "outline-none transition-[box-shadow,transform] hover:shadow-[0_0_34px_-2px_rgba(139,92,246,0.75)]",
                  "hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "motion-reduce:shadow-[0_0_18px_-4px_rgba(139,92,246,0.45)] motion-reduce:hover:shadow-[0_0_22px_-4px_rgba(139,92,246,0.55)] motion-reduce:transition-none motion-reduce:hover:brightness-100",
                )}
              >
                Understood
              </button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
