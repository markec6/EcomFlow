import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

let cachedAdminClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error("Missing Supabase admin variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
    return null
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return cachedAdminClient
}
