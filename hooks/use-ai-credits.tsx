"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { getSupabaseClient } from "@/lib/supabase/client"

/** One Deep Analysis tap — price is always this (never confuse with signup grant). */
export const AI_ACTION_CREDIT_COST = 1

/** Every signed-in user's starting / repaired balance in Supabase. */
export const SIGNUP_CREDIT_GRANT = 300

const UNIT_PRICE = AI_ACTION_CREDIT_COST
const GUEST_LOCAL_KEY = "ecomflow_wallet_guest_v2"
const GUEST_INITIAL = 3
const GUEST_CEILING = 3
/** Allow spending deep below the initial grant — cap avoids corrupt values only. */
const BALANCE_HARD_CAP = 999_999

export type WalletProfileFace = {
  fullName: string | null
  username: string | null
  avatarUrl: string | null
}

export type AiCreditsContextValue = {
  credits: number
  maxCredits: number
  /** Guest-only line for wallet chip (includes empty-state copy); empty when signed in. */
  guestCreditHeaderSummary: string
  isReady: boolean
  isGuest: boolean
  userId: string | null
  userEmail: string | null
  profile: WalletProfileFace
  refreshCredits: () => Promise<void>
  decrementCredit: () => Promise<boolean>
  setCredits: (next: number | ((prev: number) => number)) => Promise<void>
}

function clampCredits(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(BALANCE_HARD_CAP, Math.round(n)))
}

/** True when `ai_credits_remaining` was never set (null / undefined / NaN). Numeric 0 is a real spent balance — do not re-grant. */
function needsSignupGrant(raw: unknown): boolean {
  if (raw === null || raw === undefined) return true
  const n = Number(raw)
  return !Number.isFinite(n)
}

/** Clears non-auth client keys (e.g. after logout). Guest credits are not persisted — legacy wallet key is removed. */
export function clearClientSessionData() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(GUEST_LOCAL_KEY)
    localStorage.removeItem("ecomflow_active_product_id")
  } catch {
    /* ignore */
  }
}

const CreditWalletContext = createContext<AiCreditsContextValue | null>(null)

export function AiCreditsProvider({ children }: { children: ReactNode }) {
  const { isLoaded: authReady, isSignedIn, userId: clerkSubject, getToken } = useAuth()
  const { user } = useUser()
  const emailPrimary = user?.primaryEmailAddress?.emailAddress ?? null

  const [credits, setCreditsState] = useState(SIGNUP_CREDIT_GRANT)
  const [isReady, setIsReady] = useState(false)
  const creditsRef = useRef(SIGNUP_CREDIT_GRANT)
  const guestOnlyRef = useRef(true)
  /** Tracks prior signed-in state so guest wallet resets on session start / logout only — not on guest `pullDisplayFromSources` churn. */
  const prevIsSignedInRef = useRef<boolean | null>(null)

  useEffect(() => {
    creditsRef.current = credits
  }, [credits])

  const pullDisplayFromSources = useCallback(async () => {
    if (!authReady) return

    /* ---- GUEST: !signed-in (session-only wallet; full grant only on new guest session or after logout) */
    if (!isSignedIn || !clerkSubject) {
      guestOnlyRef.current = true
      const wasSignedIn = prevIsSignedInRef.current === true
      const firstGuestResolve = prevIsSignedInRef.current === null
      prevIsSignedInRef.current = false
      if (wasSignedIn || firstGuestResolve) {
        creditsRef.current = GUEST_INITIAL
        setCreditsState(GUEST_INITIAL)
      }
      setIsReady(true)
      return
    }

    guestOnlyRef.current = false
    prevIsSignedInRef.current = true

    const supabase = getSupabaseClient()
    if (!user || !supabase) {
      return
    }

    /*
     * Fallback until we have a confirmed DB read: SIGNUP_CREDIT_GRANT — never imply 0.
     */
    const applyDisplayedBalance = (
      numericFromDb: number | null | undefined,
      fallbackUsed: boolean,
    ) => {
      const parsed =
        numericFromDb == null || Number.isNaN(Number(numericFromDb))
          ? undefined
          : Number(numericFromDb)
      const displayCredits =
        fallbackUsed ||
        numericFromDb == null ||
        !Number.isFinite(Number(numericFromDb))
          ? (parsed ?? SIGNUP_CREDIT_GRANT)
          : parsed!
      creditsRef.current = clampCredits(displayCredits)
      setCreditsState(creditsRef.current)
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("ai_credits_remaining")
      .eq("id", clerkSubject)
      .maybeSingle()

    const rowConfirmed =
      data != null &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      Object.prototype.hasOwnProperty.call(data, "ai_credits_remaining")

    if (error || !rowConfirmed) {
      applyDisplayedBalance(undefined, true)
      setIsReady(true)
      return
    }

    let dbRaw = (data as { ai_credits_remaining: unknown }).ai_credits_remaining

    /*
     * NEW USER: column unset (null) or non-numeric → persist full grant immediately.
     */
    if (needsSignupGrant(dbRaw)) {
      const { error: patchError } = await supabase
        .from("profiles")
        .update({ ai_credits_remaining: SIGNUP_CREDIT_GRANT })
        .eq("id", clerkSubject)

      if (patchError) {
        console.error("[creditWallet] initial grant patch failed:", patchError)
        applyDisplayedBalance(SIGNUP_CREDIT_GRANT, true)
      } else {
        applyDisplayedBalance(SIGNUP_CREDIT_GRANT, false)
      }
      setIsReady(true)
      return
    }

    const displayCredits = clampCredits(Number(dbRaw))
    creditsRef.current = displayCredits
    setCreditsState(displayCredits)
    setIsReady(true)
  }, [authReady, isSignedIn, clerkSubject, getToken, user])

  useEffect(() => {
    void pullDisplayFromSources()
  }, [pullDisplayFromSources])

  /*
   * SPENDING RULE: balance > 0 → subtract PRICE (1); guests in-memory only, signed-in → Supabase.
   */
  const decrementCredit = useCallback(async (): Promise<boolean> => {
    if (!(creditsRef.current > 0)) {
      return false
    }

    if (guestOnlyRef.current) {
      const guestNext = Math.max(0, Math.min(GUEST_CEILING, creditsRef.current - UNIT_PRICE))
      creditsRef.current = guestNext
      setCreditsState(guestNext)
      return true
    }

    if (!clerkSubject) {
      console.error("[creditWallet] spend: missing signed-in identity")
      return false
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      console.error("[creditWallet] spend: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
      return false
    }

    const admin = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const nextBal = clampCredits(creditsRef.current - UNIT_PRICE)
    const { error } = await admin
      .from("profiles")
      .update({ ai_credits_remaining: nextBal })
      .eq("id", clerkSubject)

    if (error) {
      console.error("[creditWallet] spend (service role):", error)
      return false
    }

    creditsRef.current = nextBal
    setCreditsState(nextBal)
    return true
  }, [clerkSubject])

  const setCredits = useCallback(
    async (next: number | ((prev: number) => number)) => {
      const resolved =
        typeof next === "function" ? next(creditsRef.current) : next
      const normalized = clampCredits(resolved)

      if (guestOnlyRef.current) {
        const guestVal = Math.max(0, Math.min(GUEST_CEILING, normalized))
        creditsRef.current = guestVal
        setCreditsState(guestVal)
        return
      }

      if (!clerkSubject || !getToken) return

      let tokenProbe: string | null = null
      try {
        tokenProbe = (await getToken({ template: "supabase" })) ?? null
      } catch (e) {
        console.error("[creditWallet] setCredits: getToken threw:", e)
        return
      }

      if (!tokenProbe) return

      const client = getSupabaseClient()
      if (!client) return

      const { error } = await client
        .from("profiles")
        .update({ ai_credits_remaining: normalized })
        .eq("id", clerkSubject)

      if (error) {
        console.error("[creditWallet] setCredits: update failed:", error)
        return
      }

      creditsRef.current = normalized
      setCreditsState(normalized)
    },
    [clerkSubject, getToken],
  )

  const face: WalletProfileFace = {
    fullName: user?.fullName ?? null,
    username: user?.username ?? null,
    avatarUrl: user?.imageUrl ?? null,
  }

  const visitor = Boolean(authReady && (!isSignedIn || !clerkSubject))

  const guestCreditHeaderSummary = visitor
    ? credits <= 0
      ? "Sign in for 300 credits"
      : `Guest · ${credits}/3`
    : ""

  const value: AiCreditsContextValue = {
    credits,
    maxCredits: visitor ? GUEST_CEILING : SIGNUP_CREDIT_GRANT,
    guestCreditHeaderSummary,
    isReady,
    isGuest: visitor,
    userId: isSignedIn && clerkSubject ? clerkSubject : null,
    userEmail: emailPrimary,
    profile: face,
    refreshCredits: pullDisplayFromSources,
    decrementCredit,
    setCredits,
  }

  return <CreditWalletContext.Provider value={value}>{children}</CreditWalletContext.Provider>
}

export function useAiCredits(): AiCreditsContextValue {
  const ctx = useContext(CreditWalletContext)
  if (!ctx) {
    throw new Error("useAiCredits must be used inside AiCreditsProvider")
  }
  return ctx
}
