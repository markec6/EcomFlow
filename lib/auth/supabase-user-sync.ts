"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { getSupabaseClient } from "@/lib/supabase/client"

export const SIGNUP_CREDITS = 300

type SyncUserInput = {
  clerkUserId: string
  email: string
  username?: string | null
  fullName?: string | null
  birthDate?: string | null
}

type CreditRecord = {
  credits: number
}

type ProfileCreditRecord = {
  ai_credits_remaining: number
}

type SupabaseTableQuery = {
  select: (columns?: string) => SupabaseTableQuery
  eq: (column: string, value: unknown) => SupabaseTableQuery
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>
  single: () => Promise<{ data: unknown; error: unknown }>
  upsert: (values: Record<string, unknown> | Record<string, unknown>[], options?: Record<string, unknown>) => SupabaseTableQuery
  update: (values: Record<string, unknown>) => SupabaseTableQuery
}

type WritableSupabaseClient = {
  from: (table: string) => SupabaseTableQuery
}

function normalizeCredits(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function getWritableSupabaseClient() {
  return getSupabaseClient() as WritableSupabaseClient | null
}

export async function fetchSupabaseCredits(clerkUserId: string) {
  const client = getWritableSupabaseClient()
  if (!client) return 0

  const { data: userCredits } = await client
    .from("users")
    .select("credits")
    .eq("id", clerkUserId)
    .maybeSingle()

  if (userCredits) {
    return normalizeCredits((userCredits as CreditRecord).credits)
  }

  const { data: profileCredits } = await client
    .from("profiles")
    .select("ai_credits_remaining")
    .eq("id", clerkUserId)
    .maybeSingle()

  return normalizeCredits((profileCredits as ProfileCreditRecord | null)?.ai_credits_remaining)
}

export async function syncClerkUserToSupabase(input: SyncUserInput) {
  const client = getWritableSupabaseClient()
  if (!client) {
    throw new Error("Supabase is not configured.")
  }

  const usersResult = await client
    .from("users")
    .upsert(
      {
        id: input.clerkUserId,
        credits: SIGNUP_CREDITS,
      },
      { onConflict: "id" }
    )
    .select("credits")
    .single()

  if (usersResult.error) {
    throw usersResult.error
  }

  await syncProfileCredits(client, input)

  return normalizeCredits((usersResult.data as CreditRecord | null)?.credits, SIGNUP_CREDITS)
}

export async function syncProfileCredits(client: SupabaseClient<Database> | WritableSupabaseClient, input: SyncUserInput) {
  await (client as WritableSupabaseClient).from("profiles").upsert(
    {
      id: input.clerkUserId,
      email: input.email.trim(),
      username: input.username?.trim() || null,
      full_name: input.fullName?.trim() || null,
      birth_date: input.birthDate || null,
      ai_credits_remaining: SIGNUP_CREDITS,
    },
    { onConflict: "id" }
  )
}
