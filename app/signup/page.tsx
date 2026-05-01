"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { useSignUp } from "@clerk/nextjs/legacy"
import { clearClientSessionData } from "@/hooks/use-ai-credits"
import { SIGNUP_CREDITS, syncClerkUserToSupabase } from "@/lib/auth/supabase-user-sync"

export default function SignupPage() {
  const router = useRouter()
  const { isLoaded, signUp, setActive } = useSignUp()
  const [username, setUsername] = useState<string>("")
  const [fullName, setFullName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [pendingVerification, setPendingVerification] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [focused, setFocused] = useState<"username" | "email" | "password" | "birthDate" | null>(null)

  const passwordTooShort = useMemo(() => password.length > 0 && password.length < 8, [password])

  const onSignup = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoaded || !signUp) return
    setAuthError(null)
    if (!username.trim()) {
      setAuthError("Username is required.")
      return toast.error("Username is required.")
    }
    if (!birthDate) {
      setAuthError("Date of birth is required.")
      return toast.error("Date of birth is required.")
    }
    if (passwordTooShort) {
      setAuthError("Password must be at least 8 characters.")
      return toast.error("Password must be at least 8 characters.")
    }
    setLoading(true)
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        username: username.trim(),
        unsafeMetadata: {
          fullName: fullName.trim() || null,
          birthDate: birthDate || null,
        },
      })
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setPendingVerification(true)
      toast.success("Verification code sent to your email.")
    } catch (error) {
      const clerkMessage = (error as { errors?: { message?: string }[] } | undefined)?.errors?.[0]?.message
      setLoading(false)
      setAuthError(clerkMessage ?? "Signup failed.")
      toast.error(clerkMessage ?? "Signup failed.")
      return
    }
    setLoading(false)
  }

  const onVerifyCode = async () => {
    if (!isLoaded || !signUp) return
    setAuthError(null)
    if (!verificationCode.trim()) {
      setAuthError("Enter verification code.")
      return toast.error("Enter verification code.")
    }
    setLoading(true)
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: verificationCode.trim() })
      if (attempt.status !== "complete") {
        setLoading(false)
        toast.error("Verification is not complete yet.")
        return
      }
      const createdUserId = (attempt as { createdUserId?: string }).createdUserId ?? (signUp as { createdUserId?: string }).createdUserId
      if (!createdUserId) {
        throw new Error("Clerk did not return a user id.")
      }
      const syncedCredits = await syncClerkUserToSupabase({
        clerkUserId: createdUserId,
        email,
        username,
        fullName,
        birthDate,
      })
      if (attempt.createdSessionId) {
        await setActive?.({ session: attempt.createdSessionId })
      }
      clearClientSessionData()
      toast.success(`Account ready with ${syncedCredits} credits.`)
      router.refresh()
    } catch (error) {
      const clerkMessage = (error as { errors?: { message?: string }[] } | undefined)?.errors?.[0]?.message
      const message = clerkMessage ?? (error instanceof Error ? error.message : "Verification failed.")
      setAuthError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-0">
        <motion.div className="absolute -top-20 left-1/3 w-[28rem] h-[28rem] rounded-full blur-[130px] bg-violet-500/20" animate={{ x: [0, 30, -15, 0], y: [0, -15, 20, 0] }} transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <form onSubmit={onSignup} className="w-full max-w-md max-h-[86vh] overflow-y-auto glass-panel border border-primary/20 rounded-2xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start with {SIGNUP_CREDITS} AI credits and unlock the war room.</p>
        </div>
        {authError && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{authError}</p>
        )}
        <motion.div animate={focused === "username" ? { boxShadow: "0 0 0 1px rgba(139,92,246,0.6), 0 0 18px rgba(139,92,246,0.25)" } : { boxShadow: "none" }} className="rounded-xl">
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
          {!pendingVerification ? (
            <motion.div key="email-signup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <motion.div animate={focused === "password" || passwordTooShort ? { boxShadow: passwordTooShort ? "0 0 0 1px rgba(248,113,113,0.7), 0 0 18px rgba(248,113,113,0.2)" : "0 0 0 1px rgba(139,92,246,0.6), 0 0 18px rgba(139,92,246,0.25)" } : { boxShadow: "none" }} className="rounded-xl">
                <div className="relative">
                  <input value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} type={showPassword ? "text" : "password"} placeholder="Password (min 8 chars)" className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 pl-3 pr-10 text-sm text-foreground" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
              <button disabled={loading} className="w-full h-11 rounded-xl bg-primary text-white font-medium disabled:opacity-70 inline-flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </motion.div>
          ) : (
            <motion.div key="code-verify" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                type="text"
                placeholder="Email verification code"
                className="w-full h-11 rounded-xl bg-black/30 border border-primary/20 px-3 text-sm text-foreground"
              />
              <button type="button" onClick={onVerifyCode} disabled={loading} className="w-full h-11 rounded-xl border border-primary/30 text-primary font-medium disabled:opacity-70 inline-flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Verifying..." : "Verify Email"}
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
