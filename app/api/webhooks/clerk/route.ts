import { NextResponse } from "next/server"
import { ensureSupabaseProfileServer } from "@/lib/auth/supabase-user-sync-server"

type ClerkEmailAddress = {
  id: string
  email_address: string
}

type ClerkWebhookPayload = {
  type?: string
  data?: {
    id?: string
    primary_email_address_id?: string | null
    email_addresses?: ClerkEmailAddress[]
  }
}

export async function POST(request: Request) {
  let payload: ClerkWebhookPayload
  try {
    payload = (await request.json()) as ClerkWebhookPayload
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid webhook payload" }, { status: 400 })
  }

  const eventType = payload.type ?? ""
  if (eventType !== "user.created" && eventType !== "user.updated") {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const clerkUserId = payload.data?.id ?? ""
  const primaryEmailId = payload.data?.primary_email_address_id ?? null
  const email =
    payload.data?.email_addresses?.find((entry) => entry.id === primaryEmailId)?.email_address ??
    payload.data?.email_addresses?.[0]?.email_address ??
    ""

  if (!clerkUserId || !email) {
    return NextResponse.json({ ok: false, error: "Missing Clerk user id or email" }, { status: 400 })
  }

  const synced = await ensureSupabaseProfileServer({ clerkUserId, email })
  if (!synced) {
    return NextResponse.json({ ok: false, error: "Supabase sync failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, profileId: synced.id, credits: synced.credits })
}
