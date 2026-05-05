"use client"

import { memo, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, Bell, Zap, LogOut, UserCircle2, Settings, ChevronLeft, Menu } from "lucide-react"
import { clearClientSessionData, useAiCredits } from "@/hooks/use-ai-credits"
import { SignInButton, UserButton, useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebarState } from "@/components/dashboard/sidebar-state"
import { getSupabaseClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

const PROFILE_EVENT = "ecomflow-profile-sync"

interface HeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export const Header = memo(function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const router = useRouter()
  const { signOut, userId: clerkUserId, isSignedIn, isLoaded: authLoaded } = useAuth()
  const { user } = useUser()
  const sessionEmail = isSignedIn ? (user?.primaryEmailAddress?.emailAddress ?? null) : null
  const { credits, isReady, profile, guestCreditHeaderSummary } = useAiCredits()
  const isMobile = useIsMobile()
  const { isOpen, toggleSidebar } = useSidebarState()
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const sessionValid = Boolean(isSignedIn)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    const fallbackAvatarUrl = user?.imageUrl ?? profile.avatarUrl ?? null

    const fetchProfileAvatar = async () => {
      try {
        if (!isSignedIn || !clerkUserId) {
          setAvatarUrl(null)
          return
        }

        // localStorage avatar only applies while signed in — set it immediately, no Supabase round-trip needed.
        const localAvatar = typeof window !== "undefined" ? localStorage.getItem("ecomflow_avatar_url") : null
        if (localAvatar) {
          setAvatarUrl(localAvatar)
          return
        }

        setAvatarUrl((current) => current ?? fallbackAvatarUrl)

        const supabase = getSupabaseClient()
        if (!supabase) {
          setAvatarUrl(fallbackAvatarUrl)
          return
        }

        const profilesTable = supabase.from("profiles") as any
        const { data, error } = await profilesTable.select("avatar_url").eq("id", clerkUserId).maybeSingle()

        if (cancelled) return
        if (error) {
          setAvatarUrl(fallbackAvatarUrl)
          return
        }
        setAvatarUrl(data?.avatar_url || fallbackAvatarUrl)
      } catch {
        if (!cancelled) setAvatarUrl(fallbackAvatarUrl)
      }
    }

    void fetchProfileAvatar()

    const profileEventListener = (event: Event) => {
      if (!isSignedIn || !clerkUserId) {
        setAvatarUrl(null)
        return
      }
      const nextAvatarUrl = (event as CustomEvent<{ avatarUrl?: string }>).detail?.avatarUrl
      if (nextAvatarUrl) {
        setAvatarUrl(nextAvatarUrl)
      }
      void fetchProfileAvatar()
    }

    window.addEventListener(PROFILE_EVENT, profileEventListener, { passive: true })
    return () => {
      cancelled = true
      window.removeEventListener(PROFILE_EVENT, profileEventListener)
    }
  }, [clerkUserId, isSignedIn, profile.avatarUrl, user?.imageUrl])

  const handleLogout = async () => {
    await signOut()
    clearClientSessionData()
    try {
      if (typeof window !== "undefined") localStorage.removeItem("ecomflow_avatar_url")
    } catch {
      /* ignore */
    }
    setAvatarUrl(null)
    toast.success("Logged out successfully.")
    window.location.href = "/login"
  }

  const initials = useMemo(
    () =>
      (profile.fullName || profile.username || sessionEmail || "G")
        .split(" ")
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2),
    [profile.fullName, profile.username, sessionEmail]
  )

  const avatarNode = isSignedIn && avatarUrl ? (
    <img
      key={avatarUrl}
      src={avatarUrl}
      alt="User avatar"
      className="w-full h-full rounded-full object-cover"
    />
  ) : !isSignedIn ? (
    <div className="w-full h-full bg-zinc-700 text-zinc-300 flex items-center justify-center">
      <UserCircle2 className="w-6 h-6" />
    </div>
  ) : (
    <div className="w-full h-full bg-zinc-700 text-zinc-100 text-xs font-semibold flex items-center justify-center">
      {initials || "U"}
    </div>
  )

  return (
    <header
      style={{ left: "var(--content-offset, 0px)" }}
      className="fixed top-0 right-0 h-16 flex items-center gap-3 px-3 sm:px-4 md:px-6 glass max-md:bg-card/95 border-b border-border/70 z-[100] will-change-[left,transform] transform-gpu transition-[left] duration-200 ease-out"
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="relative min-w-11 min-h-11 w-11 h-11 shrink-0 rounded-xl glass-panel border border-primary/30 flex items-center justify-center text-primary touch-manipulation z-[110]"
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <motion.span
          initial={false}
          animate={{ rotate: isOpen ? 0 : 180 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="inline-flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.span>
      </button>

      {/* Centered Search */}
      <motion.div
        initial={isMobile ? false : { y: -20, opacity: 0 }}
        animate={isMobile ? undefined : { y: 0, opacity: 1 }}
        className="flex-1 min-w-0 max-w-3xl mx-auto"
      >
        <div className="relative group overflow-hidden rounded-xl">
          <Search className="pointer-events-none absolute left-3 md:left-4 top-1/2 z-[2] -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="relative z-0 w-full h-10 pl-9 md:pl-11 pr-4 md:pr-5 rounded-xl glass-panel text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {/* Decorative right-edge fade + soft inner shadow; no pointer / semantic role */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-11 sm:w-14 rounded-r-xl bg-gradient-to-l from-card/90 via-card/35 to-transparent shadow-[inset_-6px_0_12px_-4px_rgba(0,0,0,0.07)] transition-[width,opacity,box-shadow,background-image] duration-300 dark:from-card/70 dark:via-card/20 dark:shadow-[inset_-6px_0_14px_-4px_rgba(0,0,0,0.42)] group-focus-within:w-14 sm:group-focus-within:w-16 group-focus-within:from-primary/[0.14] group-focus-within:via-primary/[0.04] group-focus-within:shadow-[inset_-10px_0_22px_-6px_color-mix(in_srgb,var(--primary)_22%,transparent)]"
          />
        </div>
      </motion.div>

      <div className="flex shrink-0 items-center gap-2 lg:hidden">
        {!authLoaded ? (
          <div className="h-10 w-[4.5rem] rounded-xl glass-panel border border-primary/20 animate-pulse" aria-hidden />
        ) : isSignedIn ? (
          <UserButton
            afterSignOutUrl="/login"
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
              },
            }}
          />
        ) : (
          <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
            <button
              type="button"
              className="rounded-xl border border-primary/30 bg-gradient-to-r from-violet-600 to-purple-500 px-3 py-2 text-xs font-semibold text-white touch-manipulation"
            >
              Sign in
            </button>
          </SignInButton>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
        className="lg:hidden relative w-11 h-11 shrink-0 rounded-xl glass-panel border border-primary/30 flex items-center justify-center text-primary touch-manipulation"
        aria-label="Open mobile account menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Right section */}
      <motion.div
        initial={isMobile ? false : { x: 20, opacity: 0 }}
        animate={isMobile ? undefined : { x: 0, opacity: 1 }}
        className="hidden lg:flex items-center gap-4"
      >
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border ${supabaseConfigured ? "border-emerald-400/20" : "border-rose-400/20"}`}>
          <motion.span
            className={`w-2.5 h-2.5 rounded-full ${supabaseConfigured ? "bg-emerald-400" : "bg-rose-400"}`}
            animate={{ scale: [1, 1.25, 1], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className={`text-xs font-medium ${supabaseConfigured ? "text-emerald-300" : "text-rose-300"}`}>
            Supabase Connection: {supabaseConfigured ? "Active" : "Inactive (Missing Env)"}
          </span>
        </div>
        {!mounted || !isReady || !authLoaded ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-primary/25">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-semibold">Loading credits...</span>
          </div>
        ) : isSignedIn ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-primary/25">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-semibold">{credits} Credits</span>
            {sessionEmail ? (
              <span className="text-[11px] text-muted-foreground">• {sessionEmail}</span>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-primary/25">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-semibold">{guestCreditHeaderSummary}</span>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="ml-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[10px] font-semibold hover:opacity-95"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Notification Bell */}
        <motion.button
          whileHover={isMobile ? undefined : { scale: 1.06, y: -1 }}
          whileTap={{ scale: 0.96 }}
          className="relative w-11 h-11 rounded-xl glass-panel soft-hover flex items-center justify-center touch-manipulation"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {/* Red dot with pulse */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive pulse-ring" />
        </motion.button>

        {/* Profile Avatar with Pro ring */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button whileHover={isMobile ? undefined : { scale: 1.05 }} className="relative touch-manipulation">
              <div className={`absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary to-violet-400 opacity-75${isMobile ? "" : " animate-pulse"}`} />
              <div className="relative w-10 h-10 rounded-full bg-card border-2 border-background overflow-hidden">
                {avatarNode}
              </div>
              {!isSignedIn && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-zinc-600 text-white">
                  Guest
                </span>
              )}
              {isSignedIn && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary text-white">
                  PRO
                </span>
              )}
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-panel bg-slate-950/95 border border-primary/20 min-w-[210px]">
            {authLoaded ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                {isSignedIn ? sessionEmail ?? "Account" : "Guest"}
              </div>
            ) : null}
            {isSignedIn ? (
              <>
                <DropdownMenuItem onClick={() => router.push("/settings")} className="text-foreground min-h-11 touch-manipulation">
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-foreground min-h-11 touch-manipulation">
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => router.push("/login")} className="text-foreground min-h-11 touch-manipulation">
                <UserCircle2 className="w-4 h-4" />
                Log in
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={isMobile ? { opacity: 0, y: -6 } : { opacity: 0, y: -12, scale: 0.98 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { opacity: 0, y: -4 } : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="lg:hidden absolute top-full right-2 mt-2 w-[min(22rem,calc(100vw-5rem))] rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-[0_18px_60px_rgba(2,6,23,0.45)] will-change-transform transform-gpu"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-primary/30 bg-zinc-800">
                {avatarNode}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {isSignedIn ? sessionEmail ?? "Account" : "Guest"}
                </p>
                <p className="text-xs text-muted-foreground">{sessionValid ? "Authenticated profile" : "Guest mode"}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${supabaseConfigured ? "border-emerald-400/20" : "border-rose-400/20"}`}>
                <span className="text-xs text-muted-foreground">Supabase Connection</span>
                <span className={`text-xs font-semibold ${supabaseConfigured ? "text-emerald-300" : "text-rose-300"}`}>
                  {supabaseConfigured ? "Active" : "Inactive (Missing Env)"}
                </span>
              </div>

              {!mounted || !isReady || !authLoaded ? (
                <div className="flex items-center justify-between rounded-xl border border-primary/20 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    Credits
                  </span>
                  <span className="text-xs text-foreground font-semibold">Loading...</span>
                </div>
              ) : isSignedIn ? (
                <div className="flex items-center justify-between rounded-xl border border-primary/20 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    Credits
                  </span>
                  <span className="text-xs text-foreground font-semibold">{credits}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-primary/20 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    Guest
                  </span>
                  <span className="text-xs text-foreground font-semibold text-right max-w-[14rem]">
                    {guestCreditHeaderSummary}
                  </span>
                </div>
              )}

              {isSignedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => router.push("/settings")}
                    className="w-full min-h-11 rounded-xl border border-white/10 px-3 py-2 text-sm text-foreground touch-manipulation"
                  >
                    Open Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="w-full min-h-11 rounded-xl border border-white/10 px-3 py-2 text-sm text-foreground touch-manipulation"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="w-full min-h-11 rounded-xl border border-white/10 px-3 py-2 text-sm text-foreground touch-manipulation"
                >
                  Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
})
