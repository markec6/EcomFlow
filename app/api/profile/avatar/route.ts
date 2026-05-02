import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  // STEP A: Connect to Supabase
  const admin = getSupabaseAdminClient()
  if (!admin) {
    console.log("[AVATAR UPLOAD] STEP A FAILED: Could not connect to Supabase admin client. Check SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.")
    return NextResponse.json({ ok: false, error: "STEP_A_FAILED: Supabase admin client unavailable" }, { status: 500 })
  }
  console.log("[AVATAR UPLOAD] STEP A OK: Supabase admin client connected.")

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "File exceeds 10MB limit" }, { status: 400 })
  }

  // STEP B: Upload to Supabase Storage
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100) || "avatar"
  const filePath = `${userId}/${Date.now()}-${safeName}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(filePath, bytes, { upsert: true })

  if (uploadError) {
    console.log("[AVATAR UPLOAD] STEP B FAILED: Storage upload error ->", uploadError.message)
    return NextResponse.json({ ok: false, error: "STEP_B_FAILED: " + uploadError.message }, { status: 500 })
  }
  console.log("[AVATAR UPLOAD] STEP B OK: File uploaded to avatars/" + filePath)

  // STEP C: Retrieve public URL and sync to profiles table
  const { data: urlData } = admin.storage.from("avatars").getPublicUrl(filePath)
  const avatarUrl = urlData.publicUrl

  const { error: dbError } = await (admin.from("profiles") as ReturnType<typeof admin.from> & {
    upsert: (row: { id: string; avatar_url: string }, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>
  }).upsert({ id: userId, avatar_url: avatarUrl }, { onConflict: "id" })

  if (dbError) {
    console.log("[AVATAR UPLOAD] STEP C FAILED: profiles table update error ->", dbError.message)
    return NextResponse.json({ ok: false, error: "STEP_C_FAILED: " + dbError.message }, { status: 500 })
  }
  console.log("[AVATAR UPLOAD] STEP C OK: avatar_url persisted to profiles for user", userId)

  return NextResponse.json({ ok: true, avatarUrl })
}
