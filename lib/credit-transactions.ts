"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type ScanActionType = "deep_scan"

type SpendCreditResult =
  | { ok: true; remainingCredits: number }
  | { ok: false; reason: "duplicate" | "insufficient_credits" | "profile_missing" | "insert_failed" | "update_failed" | "rpc_failed" }

export async function spendCreditForProductScan(
  _client: SupabaseClient<Database> | null,
  userId: string,
  productId: string,
  actionType: ScanActionType = "deep_scan"
): Promise<SpendCreditResult> {
  const response = await fetch("/api/credits/spend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, actionType }),
  })

  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; remainingCredits?: number; reason?: string }
    | null

  if (!response.ok || !result) {
    return { ok: false, reason: "rpc_failed" }
  }

  if (!result.ok) {
    const rawReason = String(result.reason ?? "rpc_failed")
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

  return { ok: true, remainingCredits: Number(result.remainingCredits ?? 0) }
}
