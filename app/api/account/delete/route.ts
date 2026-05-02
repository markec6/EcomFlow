import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Nisi logovan" }, { status: 401 })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Could not delete profile." }, { status: 500 })
  }

  const profilesTable = admin.from("profiles") as any
  const { error } = await profilesTable.delete().eq("id", userId)
  if (error) {
    console.error("Supabase profile delete failed:", error)
    return NextResponse.json({ ok: false, error: "Could not delete profile." }, { status: 500 })
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(userId)
  } catch (error) {
    console.error("Clerk user delete failed:", error)
    return NextResponse.json({ ok: false, error: "Could not delete account." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
