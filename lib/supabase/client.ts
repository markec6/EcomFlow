import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type ClerkBrowserWindow = Window & {
  Clerk?: {
    loaded?: Promise<unknown>
    session?: {
      getToken: (opts?: { template?: string }) => Promise<string | null | undefined>
    }
  }
}

/**
 * JWT source registered by `<SupabaseClerkTokenBridge />` (preferred in App Router —
 * wraps `useAuth().getToken({ template: "supabase" })`).
 */
let clerkSupabaseJwtGetter: (() => Promise<string | null>) | null = null

/** Called from SupabaseClerkTokenBridge via useLayoutEffect — must stay in sync with session. */
export function registerSupabaseClerkJwtGetter(getter: (() => Promise<string | null>) | null) {
  clerkSupabaseJwtGetter = getter
}

/**
 * Clerk → Supabase: always use the JWT from the Clerk **supabase** template.
 * Resolved on every outbound Supabase HTTP request (not once at client construction).
 */
async function fetchClerkSupabaseJwt(): Promise<string | null> {
  if (clerkSupabaseJwtGetter) {
    try {
      const t = await clerkSupabaseJwtGetter()
      if (t) return t
    } catch {
      /* continue */
    }
  }

  if (typeof window === "undefined") {
    return null
  }

  try {
    const clerk = (window as ClerkBrowserWindow).Clerk
    if (clerk?.loaded && typeof clerk.loaded.then === "function") {
      await clerk.loaded.catch(() => null)
    }
    const fromSession =
      (await clerk?.session?.getToken({ template: "supabase" }))?.trim?.() ??
      null
    if (fromSession) return fromSession
  } catch {
    /* continue */
  }

  return null
}

let singleton: ReturnType<typeof createClient<Database>> | null = null

function createAuthedBrowserClient(): ReturnType<typeof createClient<Database>> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
    return null
  }

  return createClient<Database>(url, anonKey, {
    global: {
      fetch: async (input, init = {}) => {
        const headers = new Headers(init.headers ?? undefined)
        const token = await fetchClerkSupabaseJwt()
        console.log("SUPABASE_TOKEN_SENT:", token ? "YES" : "NO")
        if (token) {
          headers.set("Authorization", `Bearer ${token}`)
        }
        return fetch(input, { ...init, headers })
      },
    },
  })
}

/**
 * Browser Supabase client. The instance is reused; **`Authorization` is refreshed
 * on each request** via `session.getToken({ template: 'supabase' })` (bridge / Clerk session).
 *
 * Calling this function ensures a client exists — it does not cache JWTs across requests.
 */
export function getSupabaseClient(): ReturnType<typeof createClient<Database>> | null {
  if (typeof window === "undefined") {
    return null
  }
  if (!singleton) {
    singleton = createAuthedBrowserClient()
  }
  return singleton
}
