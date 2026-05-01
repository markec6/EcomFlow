"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { getSupabaseClient } from "@/lib/supabase/client"
import { fetchSupabaseCredits, getWritableSupabaseClient } from "@/lib/auth/supabase-user-sync"

const CREDIT_EVENT = "ecomflow-credits-sync"
const PROFILE_EVENT = "ecomflow-profile-sync"
const MAX_CREDITS = 1000
const GUEST_DEFAULT_CREDITS = 3
const GUEST_CREDIT_KEY = "guest_credits"

type ProfileSummary = {
  fullName: string | null
  username: string | null
  avatarUrl: string | null
}

type ProfileRow = {
  full_name: string | null
  username: string | null
  avatar_url: string | null
}

export function clearClientSessionData() {
  window.localStorage.removeItem(GUEST_CREDIT_KEY)
  window.localStorage.removeItem("ecomflow_active_product_id")
  window.sessionStorage.removeItem(GUEST_CREDIT_KEY)
  window.dispatchEvent(new Event(CREDIT_EVENT))
  window.dispatchEvent(new Event(PROFILE_EVENT))
}

export function useAiCredits() {
  const { isSignedIn, userId: clerkUserId } = useAuth()
  const { user } = useUser()
  const [credits, setCredits] = useState(GUEST_DEFAULT_CREDITS)
  const [isReady, setIsReady] = useState(false)
  const [isGuest, setIsGuest] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileSummary>({ fullName: null, username: null, avatarUrl: null })
  const creditsRef = useRef(GUEST_DEFAULT_CREDITS)
  const guestCreditsRef = useRef(GUEST_DEFAULT_CREDITS)
  const guestCreditsInitialized = useRef(false)

  const commitCredits = (next: number) => {
    creditsRef.current = next
    setCredits(next)
  }

  const getGuestCredits = () => {
    if (!guestCreditsInitialized.current) {
      const raw = window.localStorage.getItem(GUEST_CREDIT_KEY)
      if (!raw) {
        window.localStorage.setItem(GUEST_CREDIT_KEY, String(GUEST_DEFAULT_CREDITS))
        guestCreditsRef.current = GUEST_DEFAULT_CREDITS
      } else {
        const parsed = Number(raw)
        guestCreditsRef.current = Number.isFinite(parsed) ? Math.max(0, Math.min(GUEST_DEFAULT_CREDITS, parsed)) : GUEST_DEFAULT_CREDITS
      }
      guestCreditsInitialized.current = true
    }
    return guestCreditsRef.current
  }

  const syncCreditsFromSession = async () => {
    const client = getSupabaseClient()
    if (!isSignedIn || !clerkUserId) {
      setIsGuest(true)
      setUserId(null)
      setUserEmail(null)
      setProfile({ fullName: null, username: null, avatarUrl: null })
      commitCredits(getGuestCredits())
      setIsReady(true)
      return
    }

    if (!client) {
      setIsGuest(false)
      setUserId(clerkUserId)
      setUserEmail(user?.primaryEmailAddress?.emailAddress ?? null)
      commitCredits(0)
      setProfile({ fullName: user?.fullName ?? null, username: user?.username ?? null, avatarUrl: user?.imageUrl ?? null })
      setIsReady(true)
      return
    }

    setIsGuest(false)
    setUserId(clerkUserId)
    setUserEmail(user?.primaryEmailAddress?.emailAddress ?? null)
    const [nextCredits, profileResult] = await Promise.all([
      fetchSupabaseCredits(clerkUserId),
      client
      .from("profiles")
      .select("ai_credits_remaining,full_name,username,avatar_url")
      .eq("id", clerkUserId)
      .maybeSingle(),
    ])

    const normalizedCredits = Number.isFinite(nextCredits) ? nextCredits : 0
    const profileData = profileResult.data as ProfileRow | null
    commitCredits(normalizedCredits)
    setProfile({
      fullName: (profileData?.full_name as string | null | undefined) ?? null,
      username: (profileData?.username as string | null | undefined) ?? null,
      avatarUrl: (profileData?.avatar_url as string | null | undefined) ?? null,
    })
    setIsReady(true)
  }

  useEffect(() => {
    void syncCreditsFromSession()
    const syncListener = () => {
      void syncCreditsFromSession()
    }
    window.addEventListener(CREDIT_EVENT, syncListener, { passive: true })
    window.addEventListener(PROFILE_EVENT, syncListener, { passive: true })
    return () => {
      window.removeEventListener(CREDIT_EVENT, syncListener)
      window.removeEventListener(PROFILE_EVENT, syncListener)
    }
  }, [isSignedIn, clerkUserId, user?.primaryEmailAddress?.emailAddress, user?.fullName, user?.username, user?.imageUrl])

  const updateCredits = async (next: number | ((current: number) => number)) => {
    const nextValue = typeof next === "function" ? next(creditsRef.current) : next
    const normalized = Math.max(0, Math.min(MAX_CREDITS, Math.round(nextValue)))
    commitCredits(normalized)
    if (isGuest || !userId) {
      const nextGuestCredits = Math.min(GUEST_DEFAULT_CREDITS, normalized)
      guestCreditsRef.current = nextGuestCredits
      window.localStorage.setItem(GUEST_CREDIT_KEY, String(nextGuestCredits))
    } else {
      const client = getWritableSupabaseClient()
      if (client) {
        await Promise.all([
          client.from("users").update({ credits: normalized }).eq("id", userId),
          client.from("profiles").update({ ai_credits_remaining: normalized }).eq("id", userId),
        ])
      }
    }
    window.dispatchEvent(new Event(CREDIT_EVENT))
  }

  return {
    credits,
    maxCredits: MAX_CREDITS,
    isReady,
    isGuest,
    userId,
    userEmail,
    profile,
    refreshCredits: syncCreditsFromSession,
    decrementCredit: async () => {
      if (creditsRef.current <= 0) return false
      await updateCredits((current) => current - 1)
      return true
    },
    setCredits: updateCredits,
  }
}
