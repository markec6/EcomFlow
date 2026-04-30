"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { getAuthClient } from "@/lib/supabase/auth-client"
import { clearClientSessionData } from "@/hooks/use-ai-credits"
import { getURL } from "@/lib/site-url"

export default function SignupPage() {
  const [mode, setMode] = useState<"email" | "magic">("email")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [focused, setFocused] = useState<"username" | "email" | "password" | "birthDate" | null>(null)
  const [usernameTaken, setUsernameTaken] = useState(false)

  const passwordTooShort = useMemo(() => password.length > 0 && password.length < 8, [password])

  useEffect(() => {
    if (!username.trim()) {
      setUsernameTaken(false)
      return
    }
    const timer = window.setTimeout(async () => {
      const supabase = getAuthClient()
      const { data } = await supabase.from("profiles").select("id").eq("username", username.trim()).limit(1)
      setUsernameTaken(Boolean(data?.length))
    }, 350)
    return () => window.clearTimeout(timer)
  }, [username])

  const onSignup = async (event: FormEvent) => {
    event.preventDefault()
    if (!username.trim()) return toast.error("Username is required.")
    if (!birthDate) return toast.error("Date of birth is required.")
    if (passwordTooShort) return toast.error("Password must be at least 8 characters.")
    if (usernameTaken) return toast.error("Username is already taken.")
    setLoading(true)
    const supabase = getAuthClient()
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: getURL("/dashboard") },
    })
    console.log("SUPABASE RESPONSE:", data, signupError)
    if (signupError) {
      const lowered = signupError.message.toLowerCase()
      const shouldTrySignInFallback =
        lowered.includes("already registered") ||
        lowered.includes("already exists") ||
        lowered.includes("rate limit") ||
        lowered.includes("email not confirmed")

      if (shouldTrySignInFallback) {
        const { data: fallbackData, error: fallbackError } = await supabase.auth.signInWithPassword({ email, password })
        console.log("SUPABASE RESPONSE:", fallbackData, fallbackError)
        if (!fallbackError) {
          setLoading(false)
          setRedirecting(true)
          toast.success("Account already exists. Signed you in.")
          await supabase.auth.getSession()
          clearClientSessionData()
          window.location.href = "/market-intelligence"
          return
        }
      }

      setLoading(false)
      return toast.error(signupError.message ?? "Signup failed.")
    }
    const userId = data.user?.id
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        email,
        username: username.trim(),
        full_name: fullName.trim() || null,
        birth_date: birthDate,
      })
    }
    // Confirmation-required flow: user is created, but session is not available until email verification.
    if (!data.session) {
      setLoading(false)
      return toast.success("Account created. Please check your email to confirm your account before logging in.")
    }
    setLoading(false)
    setRedirecting(true)
    toast.success("Account created successfully.")
    await supabase.auth.getSession()
    clearClientSessionData()
    window.location.href = "/market-intelligence"
  }

  const onMagicLink = async () => {
    if (!email) return toast.error("Enter email for magic link.")
    if (!username.trim()) return toast.error("Username is required.")
    if (!birthDate) return toast.error("Date of birth is required.")
    if (usernameTaken) return toast.error("Username is already taken.")
    setLoading(true)
    const supabase = getAuthClient()
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: getURL("/dashboard") } })
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.id) {
        await supabase.from("profiles").upsert({
          id: user.id,
          email,
          username: username.trim(),
          full_name: fullName.trim() || null,
          birth_date: birthDate,
        })
      }
    }
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success("Magic link sent.")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-0">
        <motion.div className="absolute -top-20 left-1/3 w-[28rem] h-[28rem] rounded-full blur-[130px] bg-violet-500/20" animate={{ x: [0, 30, -15, 0], y: [0, -15, 20, 0] }} transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <form onSubmit={onSignup} className="w-full max-w-md max-h-[86vh] overflow-y-auto glass-panel border border-primary/20 rounded-2xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start with 1000 AI credits and unlock the war room.</p>
        </div>
        <div className="glass-panel rounded-xl p-1 grid grid-cols-2 gap-1">
          <button type="button" onClick={() => setMode("email")} className={`rounded-lg text-xs py-2 transition-colors ${mode === "email" ? "bg-primary text-white" : "text-muted-foreground"}`}>
            Email + Password
          </button>
          <button type="button" onClick={() => setMode("magic")} className={`rounded-lg text-xs py-2 transition-colors ${mode === "magic" ? "bg-primary text-white" : "text-muted-foreground"}`}>
            Magic Link
          </button>
        </div>
        <motion.div animate={focused === "username" || usernameTaken ? { boxShadow: usernameTaken ? "0 0 0 1px rgba(248,113,113,0.7), 0 0 18px rgba(248,113,113,0.2)" : "0 0 0 1px rgba(139,92,246,0.6), 0 0 18px rgba(139,92,246,0.25)" } : { boxShadow: "none" }} className="rounded-xl">
          <input value={username} onChange={(e) => setUsername(e.target.value)} onFocus={() => setFocused("username")} onBlur={() => setFocused(null)} type="text" placeholder="Username (required)" className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 px-3 text-sm text-foreground" />
        </motion.div>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} type="text" placeholder="Full name (optional)" className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 px-3 text-sm text-foreground" />
        <motion.div animate={focused === "birthDate" ? { boxShadow: "0 0 0 1px rgba(139,92,246,0.6), 0 0 18px rgba(139,92,246,0.25)" } : { boxShadow: "none" }} className="rounded-xl">
          <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} onFocus={() => setFocused("birthDate")} onBlur={() => setFocused(null)} type="date" className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 px-3 text-sm text-foreground" />
        </motion.div>
        <motion.div animate={focused === "email" ? { boxShadow: "0 0 0 1px rgba(139,92,246,0.6), 0 0 18px rgba(139,92,246,0.25)" } : { boxShadow: "none" }} className="rounded-xl">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} type="email" placeholder="Email" className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 pl-10 pr-3 text-sm text-foreground" />
          </div>
        </motion.div>
        <AnimatePresence mode="wait">
          {mode === "email" ? (
            <motion.div key="email-signup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <motion.div animate={focused === "password" || passwordTooShort ? { boxShadow: passwordTooShort ? "0 0 0 1px rgba(248,113,113,0.7), 0 0 18px rgba(248,113,113,0.2)" : "0 0 0 1px rgba(139,92,246,0.6), 0 0 18px rgba(139,92,246,0.25)" } : { boxShadow: "none" }} className="rounded-xl">
                <div className="relative">
                  <input value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} type={showPassword ? "text" : "password"} placeholder="Password (min 8 chars)" className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 pl-3 pr-10 text-sm text-foreground" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
              <button disabled={loading || redirecting} className="w-full h-11 rounded-xl bg-primary text-white font-medium disabled:opacity-70 inline-flex items-center justify-center gap-2">
                {(loading || redirecting) && <Loader2 className="w-4 h-4 animate-spin" />}
                {redirecting ? "Redirecting..." : loading ? "Creating account..." : "Create Account"}
              </button>
            </motion.div>
          ) : (
            <motion.div key="magic-signup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <button type="button" onClick={onMagicLink} disabled={loading} className="w-full h-11 rounded-xl border border-primary/30 text-primary font-medium disabled:opacity-70 inline-flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Sending link..." : "Sign Up with Magic Link"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link className="text-primary hover:underline" href="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
