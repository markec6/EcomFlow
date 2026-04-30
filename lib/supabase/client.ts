import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

let cachedClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(url, anonKey)
  }

  return cachedClient
}
