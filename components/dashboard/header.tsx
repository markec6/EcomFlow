"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, Bell, Command, Zap, LogOut, UserCircle2, Settings, Menu } from "lucide-react"
import { clearClientSessionData, useAiCredits } from "@/hooks/use-ai-credits"
import { getAuthClient } from "@/lib/supabase/auth-client"
import { useRouter } from "next/navigation"
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

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const router = useRouter()
  const { credits, isGuest, userEmail, profile } = useAiCredits()
  const sessionValid = !isGuest
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = getAuthClient()
    const loadAvatarFromProfiles = async () => {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id
      if (!userId) {
        setAvatarUrl(null)
        return
      }
      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single()
      setAvatarUrl((profileData?.avatar_url as string | null | undefined) ?? null)
    }

    void loadAvatarFromProfiles()
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadAvatarFromProfiles()
    })
    const profileEventListener = () => {
      void loadAvatarFromProfiles()
    }
    window.addEventListener(PROFILE_EVENT, profileEventListener)
    const profileChannel = supabase
      .channel("profiles-avatar-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void loadAvatarFromProfiles()
        }
      )
      .subscribe()

    return () => {
      authListener.subscription.unsubscribe()
      window.removeEventListener(PROFILE_EVENT, profileEventListener)
      void supabase.removeChannel(profileChannel)
    }
  }, [])

  const handleLogout = async () => {
    const supabase = getAuthClient()
    await supabase.auth.signOut({ scope: "global" })
    clearClientSessionData()
    toast.success("Logged out successfully.")
    window.location.href = "/login"
  }

  const initials = useMemo(
    () =>
      (profile.fullName || profile.username || userEmail || "G")
        .split(" ")
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2),
    [profile.fullName, profile.username, userEmail]
  )

  const avatarNode = avatarUrl ? (
    <img
      key={avatarUrl}
      src={avatarUrl}
      alt="User avatar"
      className="w-full h-full rounded-full object-cover"
    />
  ) : isGuest ? (
    <div className="w-full h-full bg-zinc-700 text-zinc-300 flex items-center justify-center">
      <UserCircle2 className="w-6 h-6" />
    </div>
  ) : (
    <div className="w-full h-full bg-zinc-700 text-zinc-100 text-xs font-semibold flex items-center justify-center">
      {initials || "U"}
    </div>
  )

  return (
    <header className="fixed top-0 left-14 sm:left-16 right-0 h-16 flex items-center gap-3 px-3 sm:px-4 md:px-6 glass border-b border-border/70 z-40">
      {/* Centered Search */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-1 min-w-0 max-w-3xl mx-auto"
      >
        <div className="relative group">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full h-10 pl-9 md:pl-11 pr-3 md:pr-20 rounded-xl glass-panel text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">
              <Command className="w-3 h-3 inline" />
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">K</kbd>
          </div>
        </div>
      </motion.div>

      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
        className="lg:hidden relative w-10 h-10 shrink-0 rounded-xl glass-panel border border-primary/30 flex items-center justify-center text-primary"
        aria-label="Open mobile account menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Right section */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex items-center gap-4"
      >
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border ${sessionValid ? "border-emerald-400/20" : "border-rose-400/20"}`}>
          <motion.span
            className={`w-2.5 h-2.5 rounded-full ${sessionValid ? "bg-emerald-400" : "bg-rose-400"}`}
            animate={{ scale: [1, 1.25, 1], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className={`text-xs font-medium ${sessionValid ? "text-emerald-300" : "text-rose-300"}`}>
            Live Supabase Connection: {sessionValid ? "Active" : "Inactive"}
          </span>
        </div>
        {!isGuest && credits > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-primary/25">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-semibold">{credits}/1000 Credits Left</span>
            {userEmail && <span className="text-[11px] text-muted-foreground">• {userEmail}</span>}
          </div>
        ) : isGuest && credits > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-primary/25">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-semibold">{credits}/3 Guest Credits</span>
          </div>
        ) : (
          <button
            onClick={() => router.push("/sign-up")}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-semibold hover:opacity-95"
          >
            Sign up for 300 credits
          </button>
        )}

        {/* Notification Bell */}
        <motion.button
          whileHover={{ scale: 1.06, y: -1 }}
          whileTap={{ scale: 0.96 }}
          className="relative w-10 h-10 rounded-xl glass-panel soft-hover flex items-center justify-center"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {/* Red dot with pulse */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive pulse-ring" />
        </motion.button>

        {/* Profile Avatar with Pro ring */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button whileHover={{ scale: 1.05 }} className="relative">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary to-violet-400 animate-pulse opacity-75" />
              <div className="relative w-10 h-10 rounded-full bg-card border-2 border-background overflow-hidden">
                {avatarNode}
              </div>
              {!isGuest && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary text-white">
                  PRO
                </span>
              )}
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-panel bg-slate-950/95 border border-primary/20 min-w-[210px]">
            <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
              {userEmail ?? "Guest"}
            </div>
            {!isGuest ? (
              <>
                <DropdownMenuItem onClick={() => router.push("/settings")} className="text-foreground">
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-foreground">
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => router.push("/login")} className="text-foreground">
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
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="lg:hidden absolute top-full right-2 mt-2 w-[min(22rem,calc(100vw-5rem))] rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl p-4 shadow-[0_18px_60px_rgba(2,6,23,0.45)]"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-primary/30 bg-zinc-800">
                {avatarNode}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{userEmail ?? "Guest User"}</p>
                <p className="text-xs text-muted-foreground">{sessionValid ? "Authenticated profile" : "Guest mode"}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${sessionValid ? "border-emerald-400/20" : "border-rose-400/20"}`}>
                <span className="text-xs text-muted-foreground">Supabase Connection</span>
                <span className={`text-xs font-semibold ${sessionValid ? "text-emerald-300" : "text-rose-300"}`}>
                  {sessionValid ? "Active" : "Inactive"}
                </span>
              </div>

              {!isGuest && credits > 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-primary/20 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    Credits
                  </span>
                  <span className="text-xs text-foreground font-semibold">{credits}/1000</span>
                </div>
              ) : isGuest && credits > 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-primary/20 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    Guest Credits
                  </span>
                  <span className="text-xs text-foreground font-semibold">{credits}/3</span>
                </div>
              ) : (
                <button
                  onClick={() => router.push("/sign-up")}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-3 py-2 text-sm font-semibold text-white"
                >
                  Sign up for 300 credits
                </button>
              )}

              {!isGuest ? (
                <button
                  onClick={() => router.push("/settings")}
                  className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-foreground"
                >
                  Open Settings
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-foreground"
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
}
