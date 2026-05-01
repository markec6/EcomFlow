"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { useSignIn } from "@clerk/nextjs/legacy"
import { clearClientSessionData } from "@/hooks/use-ai-credits"
import { fetchSupabaseCredits } from "@/lib/auth/supabase-user-sync"

export default function LoginPage() {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [focused, setFocused] = useState<"email" | "password" | null>(null)

  const onLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoaded || !signIn) return
    setAuthError(null)
    setLoading(true)
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      })
      if (result.status !== "complete") {
        setLoading(false)
        setAuthError("Unable to complete sign in.")
        toast.error("Unable to complete sign in.")
        return
      }
      await setActive?.({ session: result.createdSessionId })
      const signedInUserId =
        (result as { createdUserId?: string }).createdUserId ?? (signIn as { createdUserId?: string }).createdUserId
      const currentCredits = signedInUserId ? await fetchSupabaseCredits(signedInUserId) : null
      setLoading(false)
      clearClientSessionData()
      toast.success(
        currentCredits === null
          ? `Welcome back, ${email || "Trader"}!`
          : `Welcome back, ${email || "Trader"}! ${currentCredits} credits available.`
      )
      router.refresh()
    } catch (error) {
      setLoading(false)
      const message = (error as { errors?: { message?: string }[] } | undefined)?.errors?.[0]?.message
      setAuthError(message ?? "Incorrect email or password.")
      toast.error(message ?? "Incorrect email or password.")
      return
    }
  }

  const onForgotPassword = async () => {
    if (!email) return toast.error("Enter your email first.")
    if (!isLoaded || !signIn) return
    setAuthError(null)
    setLoading(true)
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      })
    } catch (error) {
      const message = (error as { errors?: { message?: string }[] } | undefined)?.errors?.[0]?.message
      setLoading(false)
      setAuthError(message ?? "Could not send reset email.")
      toast.error(message ?? "Could not send reset email.")
      return
    }
    setLoading(false)
    toast.success("Password reset email sent.")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-0">
        <motion.div className="absolute -top-20 left-1/3 w-[28rem] h-[28rem] rounded-full blur-[130px] bg-violet-500/20" animate={{ x: [0, 30, -15, 0], y: [0, -15, 20, 0] }} transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <form onSubmit={onLogin} className="w-full max-w-md glass-panel border border-primary/20 rounded-2xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to access your Intelligence workspace.</p>
        </div>
        {authError && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{authError}</p>
        )}
        <motion.div animate={focused === "email" ? { boxShadow: "0 0 0 1px rgba(139,92,246,0.6), 0 0 18px rgba(139,92,246,0.25)" } : { boxShadow: "none" }} className="rounded-xl">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} type="email" placeholder="Email" className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 pl-10 pr-3 text-sm text-foreground" />
          </div>
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.div key="email-login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              <motion.div animate={focused === "password" ? { boxShadow: "0 0 0 1px rgba(139,92,246,0.6), 0 0 18px rgba(139,92,246,0.25)" } : { boxShadow: "none" }} className="rounded-xl">
                <div className="relative">
                  <input value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} type={showPassword ? "text" : "password"} placeholder="Password" className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 pl-3 pr-10 text-sm text-foreground" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-violet-500" />
                  Remember Me
                </label>
                <button type="button" onClick={onForgotPassword} className="text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>
              <button disabled={loading} className="w-full h-11 rounded-xl bg-primary text-white font-medium disabled:opacity-70 inline-flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
          </motion.div>
        </AnimatePresence>
        <p className="text-sm text-muted-foreground">
          New here? <Link className="text-primary hover:underline" href="/signup">Create account</Link>
        </p>
      </form>
    </div>
  )
}
