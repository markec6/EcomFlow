import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export const SIGNUP_CREDITS = 300
const DEFAULT_PLAN = "FREE"

type EnsureServerProfileInput = {
  clerkUserId: string
  email: string
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function ensureSupabaseProfileServer(input: EnsureServerProfileInput) {
  const admin = getSupabaseAdminClient()
  if (!admin) return null

  const email = input.email.trim().toLowerCase()
  if (!input.clerkUserId || !email) return null

  const { data: byId } = await admin
    .from("profiles")
    .select("id,ai_credits_remaining,credits")
    .eq("id", input.clerkUserId)
    .maybeSingle()

  if (byId?.id) {
    return {
      id: String(byId.id),
      credits: toNumber(byId.ai_credits_remaining, toNumber(byId.credits, SIGNUP_CREDITS)),
    }
  }

  const { data: byEmail } = await admin
    .from("profiles")
    .select("id,ai_credits_remaining,credits")
    .eq("email", email)
    .maybeSingle()

  if (byEmail?.id) {
    return {
      id: String(byEmail.id),
      credits: toNumber(byEmail.ai_credits_remaining, toNumber(byEmail.credits, SIGNUP_CREDITS)),
    }
  }

  const insertPayload = {
    id: input.clerkUserId,
    email,
    plan_type: DEFAULT_PLAN,
    ai_credits_remaining: SIGNUP_CREDITS,
    total_credits_used: 0,
  }

  const { data, error } = await admin
    .from("profiles")
    .upsert(insertPayload, { onConflict: "id" })
    .select("id,ai_credits_remaining,credits")
    .single()

  if (error) {
    console.error("Server profile sync failed:", error)
    return null
  }

  return {
    id: String(data?.id ?? input.clerkUserId),
    credits: toNumber(data?.ai_credits_remaining, toNumber(data?.credits, SIGNUP_CREDITS)),
  }
}
