"use client"

import { useLayoutEffect } from "react"
import { useAuth, useSession } from "@clerk/nextjs"
import { registerSupabaseClerkJwtGetter } from "@/lib/supabase/client"

/**
 * Registers JWT resolution for `getSupabaseClient()` (Clerk template `supabase`).
 * useLayoutEffect ensures the getter exists before downstream effects run.
 */
export function SupabaseClerkTokenBridge() {
  const { isLoaded, getToken } = useAuth()
  const { session } = useSession()

  useLayoutEffect(() => {
    if (!isLoaded || !getToken) {
      return
    }

    registerSupabaseClerkJwtGetter(async () => {
      try {
        return (await getToken({ template: "supabase" })) ?? null
      } catch {
        return null
      }
    })

    return () => {
      registerSupabaseClerkJwtGetter(null)
    }
  }, [isLoaded, getToken, session?.id])

  return null
}
