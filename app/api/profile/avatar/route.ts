import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "avatar"
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Supabase admin client is unavailable" }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing image file" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, error: "Invalid image type" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Image is too large" }, { status: 400 })
  }

  const { error: bucketError } = await admin.storage.getBucket("avatars")
  if (bucketError) {
    const { error: createBucketError } = await admin.storage.createBucket("avatars", { public: true })
    if (createBucketError) {
      console.error("Avatar bucket setup failed:", createBucketError)
      return NextResponse.json({ ok: false, error: "Avatar bucket setup failed" }, { status: 500 })
    }
  }

  const filePath = `${userId}/${Date.now()}-${sanitizeFileName(file.name)}`
  const bytes = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(filePath, bytes, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error("Avatar upload failed:", uploadError)
    return NextResponse.json({ ok: false, error: "Avatar upload failed" }, { status: 500 })
  }

  const { data } = admin.storage.from("avatars").getPublicUrl(filePath)
  const avatarUrl = data.publicUrl
  const profilesTable = admin.from("profiles") as any
  const { data: persistedProfile, error: persistError } = await profilesTable
    .upsert({ id: userId, avatar_url: avatarUrl }, { onConflict: "id" })
    .select("id,avatar_url")
    .single()

  if (persistError || !persistedProfile?.avatar_url) {
    console.error("Avatar profile update failed:", persistError)
    return NextResponse.json({ ok: false, error: "Avatar profile update failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, avatarUrl })
}
