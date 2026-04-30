"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let authClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.")
  }

  if (!authClient) {
    authClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return authClient
}
