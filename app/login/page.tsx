"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { getAuthClient } from "@/lib/supabase/auth-client"
import { clearClientSessionData } from "@/hooks/use-ai-credits"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [mode, setMode] = useState<"email" | "magic">("email")
  const [focused, setFocused] = useState<"email" | "password" | null>(null)

  useEffect(() => {
    const supabase = getAuthClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/market-intelligence")
    })
  }, [router])

  const onLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    let loginEmail = email.trim()
    if (!loginEmail.includes("@")) {
      const lookupClient = getAuthClient()
      const { data } = await lookupClient.from("profiles").select("email").eq("username", loginEmail).single()
      loginEmail = data?.email ?? ""
    }
    if (!loginEmail) {
      setLoading(false)
      return toast.error("Username not found.")
    }

    const supabase = getAuthClient()
    // Clear potential ghost session/cookies before a fresh login attempt.
    await supabase.auth.signOut()

    const { error, data } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
    console.log("SUPABASE RESPONSE:", data, error)
    setLoading(false)
    if (error) {
      console.log("Auth Error:", error)
      const normalizedMessage = (error.message ?? "").toLowerCase()
      if (normalizedMessage.includes("email not confirmed")) {
        return toast.error("Please check your email to confirm your account.")
      }
      if (normalizedMessage.includes("invalid login credentials")) {
        return toast.error("Incorrect email or password.")
      }
      return toast.error(error.message || "Login failed.")
    }
    setRedirecting(true)
    toast.success(`Welcome back, ${data.user?.email ?? "Trader"}!`)
    await supabase.auth.getSession()
    clearClientSessionData()
    window.location.href = "/market-intelligence"
  }

  const onMagicLink = async () => {
    if (!email) return toast.error("Enter email for magic link.")
    setLoading(true)
    const supabase = getAuthClient()
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/market-intelligence` } })
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success("Magic link sent. Check your inbox.")
  }

  const onForgotPassword = async () => {
    if (!email) return toast.error("Enter your email first.")
    setLoading(true)
    const supabase = getAuthClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setLoading(false)
    if (error) return toast.error(error.message)
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
        <div className="glass-panel rounded-xl p-1 grid grid-cols-2 gap-1">
          <button type="button" onClick={() => setMode("email")} className={`rounded-lg text-xs py-2 transition-colors ${mode === "email" ? "bg-primary text-white" : "text-muted-foreground"}`}>
            Email Login
          </button>
          <button type="button" onClick={() => setMode("magic")} className={`rounded-lg text-xs py-2 transition-colors ${mode === "magic" ? "bg-primary text-white" : "text-muted-foreground"}`}>
            Magic Link
          </button>
        </div>
        <motion.div animate={focused === "email" ? { boxShadow: "0 0 0 1px rgba(139,92,246,0.6), 0 0 18px rgba(139,92,246,0.25)" } : { boxShadow: "none" }} className="rounded-xl">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} type="text" placeholder="Email or Username" className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 pl-10 pr-3 text-sm text-foreground" />
          </div>
        </motion.div>
        <AnimatePresence mode="wait">
          {mode === "email" ? (
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
              <button disabled={loading || redirecting} className="w-full h-11 rounded-xl bg-primary text-white font-medium disabled:opacity-70 inline-flex items-center justify-center gap-2">
                {(loading || redirecting) && <Loader2 className="w-4 h-4 animate-spin" />}
                {redirecting ? "Redirecting..." : loading ? "Signing in..." : "Sign In"}
              </button>
            </motion.div>
          ) : (
            <motion.div key="magic-login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <button type="button" onClick={onMagicLink} disabled={loading} className="w-full h-11 rounded-xl border border-primary/30 text-primary font-medium disabled:opacity-70 inline-flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Sending link..." : "Send Magic Link"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-sm text-muted-foreground">
          New here? <Link className="text-primary hover:underline" href="/signup">Create account</Link>
        </p>
      </form>
    </div>
  )
}
