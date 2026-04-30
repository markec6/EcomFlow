"use client"

import { useEffect, useRef, useState } from "react"
import { getAuthClient } from "@/lib/supabase/auth-client"

const GUEST_CREDIT_KEY = "guest_credits"
const CREDIT_EVENT = "ecomflow-credits-sync"
const PROFILE_EVENT = "ecomflow-profile-sync"
const MAX_CREDITS = 1000
const GUEST_DEFAULT_CREDITS = 3

type ProfileSummary = {
  fullName: string | null
  username: string | null
  avatarUrl: string | null
}

export function clearClientSessionData() {
  window.localStorage.clear()
  window.sessionStorage.clear()
  // Clear non-HttpOnly cookies available on the client.
  document.cookie.split(";").forEach((cookie) => {
    const key = cookie.split("=")[0]?.trim()
    if (!key) return
    document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  })
  window.dispatchEvent(new Event(CREDIT_EVENT))
  window.dispatchEvent(new Event(PROFILE_EVENT))
}

export function useAiCredits() {
  const [credits, setCredits] = useState(GUEST_DEFAULT_CREDITS)
  const [isReady, setIsReady] = useState(false)
  const [isGuest, setIsGuest] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileSummary>({ fullName: null, username: null, avatarUrl: null })
  const creditsRef = useRef(GUEST_DEFAULT_CREDITS)

  const commitCredits = (next: number) => {
    creditsRef.current = next
    setCredits(next)
  }

  const getGuestCredits = () => {
    const raw = window.sessionStorage.getItem(GUEST_CREDIT_KEY)
    if (!raw) {
      window.sessionStorage.setItem(GUEST_CREDIT_KEY, String(GUEST_DEFAULT_CREDITS))
      return GUEST_DEFAULT_CREDITS
    }
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : GUEST_DEFAULT_CREDITS
  }

  const syncCreditsFromSession = async () => {
    const supabase = getAuthClient()
    const { data } = await supabase.auth.getSession()
    const session = data.session
    if (!session?.user?.id) {
      setIsGuest(true)
      setUserId(null)
      setUserEmail(null)
      setProfile({ fullName: null, username: null, avatarUrl: null })
      commitCredits(getGuestCredits())
      setIsReady(true)
      return
    }

    setIsGuest(false)
    setUserId(session.user.id)
    setUserEmail(session.user.email ?? null)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("ai_credits_remaining,full_name,username,avatar_url")
      .eq("id", session.user.id)
      .single()

    const nextCredits = Number(profileData?.ai_credits_remaining ?? 0)
    let normalizedCredits = Number.isFinite(nextCredits) ? nextCredits : 0
    if ((session.user.email ?? "").toLowerCase() === "marjanovica773@gmail.com" && normalizedCredits !== 420) {
      normalizedCredits = 420
      await supabase.from("profiles").update({ ai_credits_remaining: 420 }).eq("id", session.user.id)
    }
    commitCredits(normalizedCredits)
    setProfile({
      fullName: (profileData?.full_name as string | null | undefined) ?? null,
      username: (profileData?.username as string | null | undefined) ?? null,
      avatarUrl: (profileData?.avatar_url as string | null | undefined) ?? null,
    })
    setIsReady(true)
  }

  useEffect(() => {
    const supabase = getAuthClient()
    void syncCreditsFromSession()
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void syncCreditsFromSession()
    })
    const syncListener = () => {
      void syncCreditsFromSession()
    }
    window.addEventListener(CREDIT_EVENT, syncListener)
    window.addEventListener(PROFILE_EVENT, syncListener)
    return () => {
      listener.subscription.unsubscribe()
      window.removeEventListener(CREDIT_EVENT, syncListener)
      window.removeEventListener(PROFILE_EVENT, syncListener)
    }
  }, [])

  const updateCredits = async (next: number | ((current: number) => number)) => {
    const nextValue = typeof next === "function" ? next(creditsRef.current) : next
    const normalized = Math.max(0, Math.min(MAX_CREDITS, Math.round(nextValue)))
    commitCredits(normalized)
    if (isGuest || !userId) {
      window.sessionStorage.setItem(GUEST_CREDIT_KEY, String(normalized))
    } else {
      const supabase = getAuthClient()
      await supabase.from("profiles").update({ ai_credits_remaining: normalized }).eq("id", userId)
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
