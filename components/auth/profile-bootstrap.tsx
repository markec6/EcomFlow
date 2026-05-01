"use client"

import { useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { ensureSupabaseProfile } from "@/lib/auth/supabase-user-sync"

export function ProfileBootstrap() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return
    const email = user?.primaryEmailAddress?.emailAddress
    if (!email) return

    void ensureSupabaseProfile({
      clerkUserId: userId,
      email,
    })
  }, [isLoaded, isSignedIn, userId, user?.primaryEmailAddress?.emailAddress])

  return null
}
