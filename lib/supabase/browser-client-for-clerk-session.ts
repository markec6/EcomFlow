import { getSupabaseClient } from "@/lib/supabase/client"

/**
 * Use `getSupabaseClient()` everywhere. JWT is injected per-request (Clerk template `supabase`).
 * Ignores any stale token argument — avoids capturing an expired JWT in the client closure.
 */
export function createSupabaseBrowserClientForClerkSession(_accessToken?: string | null) {
  return getSupabaseClient()
}
