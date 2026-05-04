"use client"

import { getSupabaseClient } from "@/lib/supabase/client"

export const SIGNUP_CREDITS = 300
const DEFAULT_PLAN = "FREE"
let rlsWriteBlockedLogged = false

function warnRlsOnce() {
  if (rlsWriteBlockedLogged) return
  console.warn(
    "Supabase profile upsert blocked by RLS (no valid Clerk JWT on the request, or policy mismatch). Credits may still work via cache; ensure SupabaseClerkTokenBridge is mounted and Clerk has a `supabase` JWT template, or rely on the Clerk webhook + service role."
  )
  rlsWriteBlockedLogged = true
}

type SyncUserInput = {
  clerkUserId: string
  email: string
}

export type SyncedSupabaseProfile = {
  id: string
  credits: number
}

type WritableSupabaseClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>
      }
    }
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>
      }
    }
    upsert: (
      values: Record<string, unknown> | Record<string, unknown>[],
      options?: Record<string, unknown>
    ) => {
      select: (columns: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>
      }
    }
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => Promise<{ error: unknown }>
    }
  }
}

export function getWritableSupabaseClient() {
  return getSupabaseClient() as unknown as WritableSupabaseClient | null
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeProfile(data: Record<string, unknown> | null): SyncedSupabaseProfile | null {
  if (!data?.id) return null
  return {
    id: String(data.id),
    credits: toNumber(
      data.ai_credits_remaining,
      toNumber(data.credits, SIGNUP_CREDITS)
    ),
  }
}

function isMissingColumnError(error: unknown) {
  const code = (error as { code?: string } | null)?.code
  const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase()
  return code === "42703"
}

function isMissingConflictTargetError(error: unknown) {
  const code = (error as { code?: string } | null)?.code
  const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase()
  return code === "42P10" || message.includes("no unique or exclusion constraint")
}

function isRlsWriteError(error: unknown) {
  const code = (error as { code?: string } | null)?.code
  const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase()
  return code === "42501" || message.includes("row-level security")
}

/** Missing/invalid Clerk JWT on the request — do not invent a local 300-credit profile. */
function isUnauthorizedOrJwtError(error: unknown) {
  if (error == null || typeof error !== "object") return false
  const e = error as { code?: string; message?: string; status?: number; statusCode?: number }
  const status = e.status ?? e.statusCode
  if (status === 401) return true
  if (e.code === "PGRST301") return true
  const msg = String(e.message ?? "").toLowerCase()
  return (
    msg.includes("invalid jwt") ||
    msg.includes("jwt expired") ||
    msg.includes("jwt signature") ||
    msg.includes("permission denied for jwt")
  )
}

/** Full row snapshot for skipping redundant upserts / races after an empty first lookup. */
async function fetchProfileRowById(client: WritableSupabaseClient, clerkUserId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("id,email,plan_type,ai_credits_remaining,total_credits_used,credits")
    .eq("id", clerkUserId)
    .maybeSingle()

  if (error && !isMissingColumnError(error)) {
    if (!isUnauthorizedOrJwtError(error)) {
      console.warn("Profile row fetch by id failed:", error)
    }
    return null
  }

  if (!data || typeof data !== "object") return null
  return data as Record<string, unknown>
}

async function findProfileByClerkId(client: WritableSupabaseClient, clerkUserId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("id,ai_credits_remaining,credits")
    .eq("id", clerkUserId)
    .maybeSingle()

  if (error && !isMissingColumnError(error)) {
    if (!isUnauthorizedOrJwtError(error)) {
      console.warn("Profile lookup by Clerk ID failed:", error)
    }
  }

  return normalizeProfile(data)
}

async function findProfileByEmail(client: WritableSupabaseClient, email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return null

  const { data, error } = await client
    .from("profiles")
    .select("id,ai_credits_remaining,credits")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (error && !isMissingColumnError(error)) {
    if (!isUnauthorizedOrJwtError(error)) {
      console.warn("Profile lookup by email failed:", error)
    }
  }

  return normalizeProfile(data)
}

export async function fetchSupabaseCredits(clerkUserId: string, email?: string | null) {
  const profile = await ensureSupabaseProfile({ clerkUserId, email: email ?? "" })
  return profile?.credits ?? 0
}

export async function ensureSupabaseProfile(input: SyncUserInput): Promise<SyncedSupabaseProfile | null> {
  const client = getWritableSupabaseClient()
  if (!client) {
    return null
  }

  const email = input.email.trim().toLowerCase()
  const profileByClerkId = await findProfileByClerkId(client, input.clerkUserId)
  if (profileByClerkId) return profileByClerkId

  const profileByEmail = await findProfileByEmail(client, email)
  if (profileByEmail) {
    return profileByEmail
  }
  const insertPayload: Record<string, unknown> = {
    id: input.clerkUserId,
    email,
    plan_type: DEFAULT_PLAN,
    ai_credits_remaining: SIGNUP_CREDITS,
    total_credits_used: 0,
  }

  try {
    const rowRecheck = await fetchProfileRowById(client, input.clerkUserId)
    if (rowRecheck?.id != null) {
      // Avoid clobbering an existing profile with signup defaults; also skips writes when columns already match.
      return normalizeProfile(rowRecheck)
    }

    let data: Record<string, unknown> | null = null
    let error: unknown = null

    try {
      const upsertRes = await client
        .from("profiles")
        .upsert(insertPayload, { onConflict: "id" })
        .select("id,ai_credits_remaining,credits")
        .single()
      data = upsertRes.data
      error = upsertRes.error
    } catch (writeErr) {
      error = writeErr
    }

    if (error && isMissingConflictTargetError(error)) {
      try {
        const retry = await client
          .from("profiles")
          .insert(insertPayload)
          .select("id,ai_credits_remaining,credits")
          .single()
        data = retry.data
        error = retry.error
      } catch (retryErr) {
        error = retryErr
      }
    }

    if (error) {
      if (isUnauthorizedOrJwtError(error)) {
        return null
      }
      if (isRlsWriteError(error)) {
        warnRlsOnce()
        return null
      }
      console.warn("Supabase profile upsert failed:", error)

      const fallbackProfile =
        (await findProfileByClerkId(client, input.clerkUserId)) ??
        (await findProfileByEmail(client, email))
      if (fallbackProfile) return fallbackProfile

      return {
        id: input.clerkUserId,
        credits: SIGNUP_CREDITS,
      }
    }

    return normalizeProfile(data)
  } catch (caught) {
    if (isUnauthorizedOrJwtError(caught)) {
      return null
    }
    if (isRlsWriteError(caught)) {
      warnRlsOnce()
      return null
    }
    console.warn("Supabase profile sync failed:", caught)
    const fallbackProfile =
      (await findProfileByClerkId(client, input.clerkUserId)) ??
      (await findProfileByEmail(client, email))
    if (fallbackProfile) return fallbackProfile
    return {
      id: input.clerkUserId,
      credits: SIGNUP_CREDITS,
    }
  }
}

export async function syncClerkUserToSupabase(input: SyncUserInput) {
  const profile = await ensureSupabaseProfile(input)
  return profile?.credits ?? SIGNUP_CREDITS
}
