import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

type SpendCreditBody = {
  productId?: string
  actionType?: string
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ ok: false, reason: "admin_unavailable" }, { status: 500 })
  }

  const body = (await request.json().catch(() => ({}))) as SpendCreditBody
  const productId = String(body.productId ?? "").trim()
  const actionType = String(body.actionType ?? "deep_scan").trim() || "deep_scan"
  if (!productId) {
    return NextResponse.json({ ok: false, reason: "missing_product" }, { status: 400 })
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,ai_credits_remaining,credits")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    console.error("Credit profile lookup failed:", profileError)
    return NextResponse.json({ ok: false, reason: "profile_lookup_failed" }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, reason: "profile_missing" }, { status: 404 })
  }

  const currentCredits = Number(profile.ai_credits_remaining ?? profile.credits ?? 0)
  if (!Number.isFinite(currentCredits) || currentCredits < 1) {
    return NextResponse.json({ ok: false, reason: "insufficient_credits", remainingCredits: 0 }, { status: 402 })
  }

  const eventsTable = admin.from("credit_spend_events") as any
  const dedupeBucket = Math.floor(Date.now() / 10000)
  const { data: recentEvent, error: lookupError } = await eventsTable
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("action_type", actionType)
    .eq("dedupe_bucket", dedupeBucket)
    .maybeSingle()

  if (lookupError) {
    console.warn("Credit spend dedupe lookup skipped:", lookupError)
  }

  if (recentEvent?.id) {
    return NextResponse.json({ ok: false, reason: "duplicate", remainingCredits: currentCredits }, { status: 409 })
  }

  const remainingCredits = currentCredits - 1
  const { data: updatedProfile, error: updateError } = await admin
    .from("profiles")
    .update({ ai_credits_remaining: remainingCredits })
    .eq("id", userId)
    .select("ai_credits_remaining")
    .single()

  if (updateError) {
    console.error("Credit decrement failed:", updateError)
    return NextResponse.json({ ok: false, reason: "update_failed" }, { status: 500 })
  }

  const { error: eventError } = await eventsTable.insert({
    user_id: userId,
    product_id: productId,
    action_type: actionType,
  })
  if (eventError) {
    console.warn("Credit spend event insert skipped:", eventError)
  }

  return NextResponse.json({
    ok: true,
    remainingCredits: Number(updatedProfile?.ai_credits_remaining ?? remainingCredits),
  })
}
