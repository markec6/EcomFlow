import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function POST(request: Request) {
  // Outer try/catch guarantees a JSON response even if any step throws unexpectedly.
  try {
    // STEP A: Verify Clerk session
    const { userId } = await auth()
    if (!userId) {
      console.log("[AVATAR UPLOAD] STEP A FAILED: No Clerk userId — request is not authenticated.")
      return NextResponse.json({ ok: false, error: "STEP_A_FAILED: Unauthorized" }, { status: 401 })
    }
    console.log("[AVATAR UPLOAD] STEP A OK: Clerk userId =", userId)

    // STEP A (continued): Connect to Supabase using the Service Role key.
    // Service Role bypasses ALL RLS policies — no JWT needed.
    const admin = getSupabaseAdminClient()
    if (!admin) {
      console.log("[AVATAR UPLOAD] STEP A FAILED: Supabase admin client unavailable. Check SUPABASE_SERVICE_ROLE_KEY in .env.local.")
      return NextResponse.json({ ok: false, error: "STEP_A_FAILED: Supabase admin client unavailable" }, { status: 500 })
    }
    console.log("[AVATAR UPLOAD] STEP A OK: Supabase admin (service role) client ready.")

    // Parse the uploaded file
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file attached to the request." }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "File exceeds the 10 MB limit." }, { status: 400 })
    }

    // STEP B: Upload file to the 'avatars' storage bucket
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100) || "avatar"
    const filePath = `${userId}/${Date.now()}-${safeName}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(filePath, bytes, { upsert: true })

    if (uploadError) {
      console.log("[AVATAR UPLOAD] STEP B FAILED: Storage upload error →", uploadError.message)
      return NextResponse.json({ ok: false, error: "STEP_B_FAILED: " + uploadError.message }, { status: 500 })
    }
    console.log("[AVATAR UPLOAD] STEP B OK: File stored at avatars/" + filePath)

    // STEP C: Get the public URL and persist it to public.profiles
    const { data: urlData } = admin.storage.from("avatars").getPublicUrl(filePath)
    const avatarUrl = urlData.publicUrl
    console.log("[AVATAR UPLOAD] STEP C: Updating profiles.avatar_url for user", userId)

    // Use 'as any' to bypass the strict Supabase TS generics.
    // The service role client ignores RLS so no JWT is required.
    const { error: dbError } = await (admin as any)
      .from("profiles")
      .upsert({ id: userId, avatar_url: avatarUrl }, { onConflict: "id" })

    if (dbError) {
      console.log("[AVATAR UPLOAD] STEP C FAILED: profiles table upsert error →", dbError.message)
      return NextResponse.json({ ok: false, error: "STEP_C_FAILED: " + dbError.message }, { status: 500 })
    }
    console.log("[AVATAR UPLOAD] STEP C OK: avatar_url saved for user", userId)

    return NextResponse.json({ ok: true, avatarUrl })
  } catch (err) {
    // Catch-all: ensures the browser always receives valid JSON, never an empty/HTML body.
    const message = err instanceof Error ? err.message : String(err)
    console.log("[AVATAR UPLOAD] UNCAUGHT ERROR →", message)
    return NextResponse.json({ ok: false, error: "Unexpected server error: " + message }, { status: 500 })
  }
}
