import { NextResponse } from "next/server"
import { verifyWebhook } from "@clerk/nextjs/webhooks"
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
  console.log("[Webhook][Log 1] Webhook received.")

  const webhookSecret =
    process.env.CLERK_WEBHOOK_SECRET ??
    process.env.CLERK_WEBHOOK_SIGNING_SECRET

  if (!webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "Missing CLERK_WEBHOOK_SECRET." },
      { status: 500 }
    )
  }

  let payload: ClerkWebhookPayload
  try {
    payload = (await verifyWebhook(request, {
      signingSecret: webhookSecret,
    })) as unknown as ClerkWebhookPayload
    console.log("[Webhook][Log 2] Signature verified.")
  } catch (error) {
    console.error("[Webhook] Signature verification failed:", error)
    return NextResponse.json(
      { ok: false, error: "Webhook signature verification failed" },
      { status: 400 }
    )
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

  try {
    const synced = await ensureSupabaseProfileServer({ clerkUserId, email })
    return NextResponse.json({
      ok: true,
      profileId: synced.id,
      credits: synced.credits,
      created: synced.created,
    })
  } catch (error) {
    console.error("[Webhook][Log 4] Supabase Error:", error)
    return NextResponse.json({ ok: false, error: "Supabase sync failed" }, { status: 500 })
  }
}
