"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAuthClient } from "@/lib/supabase/auth-client"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const syncSession = async () => {
      const supabase = getAuthClient()
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace("/dashboard")
        return
      }
      router.replace("/login")
    }

    void syncSession()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
      Finalizing sign-in...
    </div>
  )
}
