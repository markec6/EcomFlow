"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type ScanActionType = "deep_scan"

type SpendCreditResult =
  | { ok: true; remainingCredits: number }
  | { ok: false; reason: "duplicate" | "insufficient_credits" | "profile_missing" | "insert_failed" | "update_failed" | "rpc_failed" }

export async function spendCreditForProductScan(
  client: SupabaseClient<Database>,
  userId: string,
  productId: string,
  actionType: ScanActionType = "deep_scan"
): Promise<SpendCreditResult> {
  const { data, error } = await client.rpc("spend_credit_for_scan", {
    p_user_id: userId,
    p_product_id: productId,
    p_action_type: actionType,
  })

  if (error) {
    return { ok: false, reason: "rpc_failed" }
  }

  const first = Array.isArray(data) ? data[0] : null
  if (!first?.ok) {
    const rawReason = String(first?.reason ?? "rpc_failed")
    const reason: SpendCreditResult extends { ok: false; reason: infer R } ? R : never =
      rawReason === "duplicate" ||
      rawReason === "insufficient_credits" ||
      rawReason === "profile_missing" ||
      rawReason === "insert_failed" ||
      rawReason === "update_failed"
        ? rawReason
        : "rpc_failed"
    return { ok: false, reason }
  }

  return { ok: true, remainingCredits: Number(first.remaining_credits ?? 0) }
}
