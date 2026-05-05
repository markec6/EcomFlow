"use client"

import { useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { ensureSupabaseProfile } from "@/lib/auth/supabase-user-sync"
import { SIGNUP_CREDIT_GRANT, useAiCredits } from "@/hooks/use-ai-credits"
import { getSupabaseClient } from "@/lib/supabase/client"

/** Null / missing / NaN need the standard grant; 0 means a real depleted balance — do not re-grant. */
function needsSignupGrant(raw: unknown): boolean {
  if (raw === null || raw === undefined) return true
  const n = Number(raw)
  return !Number.isFinite(n)
}

/**
 * Persistence + initial grant pipeline (signed users only).
 * — Prime Clerk JWT for Supabase (`template: 'supabase'`).
 * — Ensure a `profiles` row exists (`ensureSupabaseProfile`).
 * — If `ai_credits_remaining` is still null / 0, write SIGNUP_CREDIT_GRANT (300) immediately.
 * Guest credits are session-only in `use-ai-credits.tsx` (no persistence).
 */
export function ProfileBootstrap() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const { user } = useUser()
  const { refreshCredits } = useAiCredits()

  const clerkUserSignature = [
    user?.id,
    user?.updatedAt,
    user?.primaryEmailAddress?.emailAddress,
    user?.firstName,
    user?.lastName,
    user?.imageUrl,
  ].join("\u001f")

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !user) return
    void refreshCredits()
  }, [isLoaded, isSignedIn, userId, clerkUserSignature, refreshCredits])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return
    const email = user?.primaryEmailAddress?.emailAddress
    if (!email) return

    const supabase = getSupabaseClient()
    if (!(isLoaded && user && supabase)) return

    void (async () => {
      try {
        await getToken?.({ template: "supabase" })
      } catch {
        /* session warming */
      }

      await ensureSupabaseProfile({
        clerkUserId: userId,
        email,
      })

      if (!(isLoaded && user && supabase)) return

      const snapshot = await supabase
        .from("profiles")
        .select("ai_credits_remaining")
        .eq("id", userId)
        .maybeSingle()

      if (snapshot.error) return

      const row = snapshot.data
      const rowConfirmed =
        row != null &&
        typeof row === "object" &&
        !Array.isArray(row) &&
        Object.prototype.hasOwnProperty.call(row, "ai_credits_remaining")

      if (!rowConfirmed) return

      const raw = (row as { ai_credits_remaining: unknown }).ai_credits_remaining

      if (needsSignupGrant(raw)) {
        const { error: grantError } = await supabase
          .from("profiles")
          .update({ ai_credits_remaining: SIGNUP_CREDIT_GRANT })
          .eq("id", userId)

        if (grantError) {
          console.error("[profileBootstrap] initial grant update failed:", grantError)
        }
      }
    })()
  }, [getToken, isLoaded, isSignedIn, userId, user, user?.primaryEmailAddress?.emailAddress])

  return null
}
