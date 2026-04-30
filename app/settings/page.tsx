"use client"

import Image from "next/image"
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react"
import { Loader2, Lock, Mail, Shield, Trash2, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { Switch } from "@/components/ui/switch"
import { getAuthClient } from "@/lib/supabase/auth-client"
import { toast } from "sonner"
import { useAiCredits } from "@/hooks/use-ai-credits"

const PROFILE_EVENT = "ecomflow-profile-sync"

type ProfileSettings = {
  full_name: string | null
  public_bio: string | null
  avatar_url: string | null
  dark_mode: boolean | null
  email_alerts: boolean | null
  public_profile: boolean | null
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="glass-panel rounded-xl border border-white/10 p-5 h-full flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [uploading, setUploading] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [mockSyncing, setMockSyncing] = useState<"github" | "linkedin" | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null)
  const [fullName, setFullName] = useState("")
  const [publicBio, setPublicBio] = useState("")
  const [darkMode, setDarkMode] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [publicProfile, setPublicProfile] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { profile } = useAiCredits()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      const supabase = getAuthClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user?.id) {
        setLoadingSettings(false)
        return
      }
      setUserEmail(user.email ?? null)

      const { data } = await supabase
        .from("profiles")
        .select("full_name,public_bio,avatar_url,dark_mode,email_alerts,public_profile")
        .eq("id", user.id)
        .single()

      const settings = data as ProfileSettings | null
      setFullName(settings?.full_name ?? "")
      setPublicBio(settings?.public_bio ?? "")
      setCurrentAvatarUrl(settings?.avatar_url ?? null)
      setDarkMode(settings?.dark_mode ?? true)
      setEmailAlerts(settings?.email_alerts ?? true)
      setPublicProfile(settings?.public_profile ?? false)
      setLoadingSettings(false)
    }

    void loadSettings()
  }, [])

  useEffect(() => {
    // Do not let an empty profile snapshot overwrite a freshly uploaded URL.
    if (uploadedAvatarUrl) return
    if (profile.avatarUrl) {
      setCurrentAvatarUrl(profile.avatarUrl)
    }
  }, [profile.avatarUrl, uploadedAvatarUrl])

  const validateFile = (file: File) => {
    const maxBytes = 10 * 1024 * 1024
    const allowed = ["image/png", "image/jpeg", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast.error("Invalid file type - use PNG, JPG, JPEG, or WEBP.")
      return false
    }
    if (file.size > maxBytes) {
      toast.error("Slika je prevelika! Maksimalna veličina je 10MB.")
      return false
    }
    return true
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!validateFile(file)) {
      event.target.value = ""
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const uploadProfilePicture = async (event: FormEvent) => {
    event.preventDefault()
    const file = selectedFile ?? fileInputRef.current?.files?.[0]
    if (!file) {
      toast.error("Choose an image first.")
      return
    }
    if (!validateFile(file)) return

    setUploading(true)
    const supabase = getAuthClient()
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.id) {
        toast.error("Please log in to update your profile picture.")
        window.location.href = "/login"
        return
      }

      const userId = userData.user.id
      const filePath = `${userId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        })

      if (uploadError || !uploadData) {
        toast.error("Greška pri prenosu slike na server.")
        return
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const profilesTable = supabase.from("profiles") as any
      const { data: persistedProfile, error: persistError } = await profilesTable
        .upsert({ id: userId, avatar_url: data.publicUrl }, { onConflict: "id" })
        .select("id,avatar_url")
        .single()

      if (persistError || !persistedProfile?.avatar_url) {
        console.error("DB Update Error:", persistError)
        throw new Error("Failed to save avatar URL to profile")
      }

      console.log("Image successfully persisted to DB:", data.publicUrl)
      setCurrentAvatarUrl(data.publicUrl)
      setUploadedAvatarUrl(data.publicUrl)
      if (fileInputRef.current) fileInputRef.current.value = ""
      window.dispatchEvent(new Event(PROFILE_EVENT))
      router.refresh()
      toast.success("Profile picture updated.")
    } catch (error) {
      if (error instanceof Error && error.message === "Failed to save avatar URL to profile") {
        toast.error("Greška pri čuvanju linka slike u bazi.")
      } else {
        console.error("Upload Error:", error)
        toast.error("Greška pri prenosu slike na server.")
      }
    } finally {
      setUploading(false)
    }
  }

  const savePersonalInfo = async (event: FormEvent) => {
    event.preventDefault()
    setSavingInfo(true)
    const supabase = getAuthClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user?.id) {
      setSavingInfo(false)
      toast.error("Please log in to update your profile.")
      return
    }

    const profilesTable = supabase.from("profiles") as any
    const { error } = await profilesTable
      .upsert(
        {
          id: userData.user.id,
          full_name: fullName.trim() || null,
          public_bio: publicBio.trim() || null,
        },
        { onConflict: "id" }
      )

    setSavingInfo(false)
    if (error) {
      toast.error("Could not save personal info.")
      return
    }
    window.dispatchEvent(new Event(PROFILE_EVENT))
    toast.success("Personal info saved.")
  }

  const savePreferences = async (
    nextDarkMode = darkMode,
    nextEmailAlerts = emailAlerts,
    nextPublicProfile = publicProfile
  ) => {
    setSavingPreferences(true)
    const supabase = getAuthClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user?.id) {
      setSavingPreferences(false)
      toast.error("Please log in to update preferences.")
      return
    }

    const profilesTable = supabase.from("profiles") as any
    const { error } = await profilesTable.upsert(
      {
        id: userData.user.id,
        dark_mode: nextDarkMode,
        email_alerts: nextEmailAlerts,
        public_profile: nextPublicProfile,
      },
      { onConflict: "id" }
    )

    setSavingPreferences(false)
    if (error) {
      toast.error("Could not save preferences.")
      return
    }
    toast.success("Preferences saved.")
  }

  const sendResetPassword = async () => {
    if (!userEmail) {
      toast.error("No email address found for this account.")
      return
    }
    setSendingReset(true)
    const supabase = getAuthClient()
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/login`,
    })
    setSendingReset(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Password reset email sent.")
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    await new Promise<void>((resolve) => setTimeout(resolve, 700))
    setDeletingAccount(false)
    toast.error("Account deletion requires admin confirmation and is not enabled in this demo.")
  }

  const runMockSync = async (provider: "github" | "linkedin") => {
    setMockSyncing(provider)
    await new Promise<void>((resolve) => setTimeout(resolve, 700))
    setMockSyncing(null)
    toast.success(`${provider === "github" ? "GitHub" : "LinkedIn"} sync mock is ready for backend wiring.`)
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="relative z-10 pl-14 sm:pl-16 pt-16">
        <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage identity, preferences, notifications, and account security.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            <SettingsCard title="Profile Picture" description="Upload a public avatar used across your dashboard.">
              <form onSubmit={uploadProfilePicture} className="flex flex-1 flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-5 items-start">
                  <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                    onChange={onFileChange}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">Accepted: PNG, JPG, JPEG, WEBP. Max size 10MB.</p>
                  </div>

                  <div className="flex justify-center sm:justify-end">
                    <div className="w-[170px] h-[170px] rounded-full border-2 border-primary/30 bg-zinc-800 overflow-hidden relative shadow-[0_0_30px_rgba(139,92,246,0.12)]">
                    {loadingSettings ? (
                      <div className="w-full h-full animate-pulse bg-zinc-700/70" />
                    ) : previewUrl || currentAvatarUrl ? (
                        <Image src={previewUrl || currentAvatarUrl || ""} alt="Avatar preview" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-300">No Image</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 rounded-xl bg-primary text-white disabled:opacity-70 inline-flex items-center justify-center gap-2 sm:col-span-1"
                  >
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                <button
                  type="button"
                  onClick={() => runMockSync("github")}
                  disabled={Boolean(mockSyncing)}
                  className="px-4 py-2 rounded-xl border border-primary/30 text-primary disabled:opacity-70 inline-flex items-center justify-center gap-2"
                >
                  {mockSyncing === "github" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mockSyncing === "github" ? "Syncing..." : "Sync from GitHub (Mock)"}
                </button>
                <button
                  type="button"
                  onClick={() => runMockSync("linkedin")}
                  disabled={Boolean(mockSyncing)}
                  className="px-4 py-2 rounded-xl border border-primary/30 text-primary disabled:opacity-70 inline-flex items-center justify-center gap-2"
                >
                  {mockSyncing === "linkedin" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mockSyncing === "linkedin" ? "Syncing..." : "Sync from LinkedIn (Mock)"}
                </button>
                </div>
              </form>
            </SettingsCard>

            <SettingsCard title="Personal Info" description="Public details displayed in your workspace identity.">
              <form onSubmit={savePersonalInfo} className="flex flex-1 flex-col space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm text-muted-foreground">Full Name</span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    placeholder="Add your full name"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm text-muted-foreground">Bio</span>
                  <textarea
                    value={publicBio}
                    onChange={(event) => setPublicBio(event.target.value)}
                    className="w-full min-h-32 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-foreground placeholder:text-muted-foreground/70 resize-none focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    placeholder="Write a short founder bio, launch focus, or team note..."
                  />
                </label>
                <div className="mt-auto pt-3">
                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="px-4 py-2 rounded-xl bg-primary text-white disabled:opacity-70 inline-flex items-center gap-2"
                  >
                    {savingInfo && <Loader2 className="w-4 h-4 animate-spin" />}
                    {savingInfo ? "Saving..." : "Save Personal Info"}
                  </button>
                </div>
              </form>
            </SettingsCard>
          </div>

          <SettingsCard title="Preferences" description="Tune how your dashboard behaves.">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Keep the premium dark interface enabled.</p>
                </div>
                <Switch
                  checked={darkMode}
                  disabled={savingPreferences}
                  onCheckedChange={(checked) => {
                    setDarkMode(checked)
                    void savePreferences(checked, emailAlerts, publicProfile)
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive product scans, trend spikes, and account updates.</p>
                  </div>
                </div>
                <Switch
                  checked={emailAlerts}
                  disabled={savingPreferences}
                  onCheckedChange={(checked) => {
                    setEmailAlerts(checked)
                    void savePreferences(darkMode, checked, publicProfile)
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Public Profile</p>
                  <p className="text-xs text-muted-foreground">Allow others to discover your public creator profile.</p>
                </div>
                <Switch
                  checked={publicProfile}
                  disabled={savingPreferences}
                  onCheckedChange={(checked) => {
                    setPublicProfile(checked)
                    void savePreferences(darkMode, emailAlerts, checked)
                  }}
                />
              </div>
              {savingPreferences && (
                <p className="inline-flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving preferences...
                </p>
              )}
            </div>
          </SettingsCard>

          <SettingsCard title="Account Security" description="Protect account access and manage sensitive actions.">
            <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Change Password</p>
                  <p className="text-xs text-muted-foreground">
                    Send a password reset link to {userEmail ?? "your account email"}.
                  </p>
                </div>
              </div>
              <button
                onClick={sendResetPassword}
                disabled={sendingReset}
                className="px-4 py-2 rounded-xl border border-primary/30 text-primary disabled:opacity-70 inline-flex items-center justify-center gap-2"
              >
                {sendingReset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {sendingReset ? "Sending..." : "Change Password"}
              </button>
            </div>
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-rose-200">Danger Zone</p>
                  <p className="text-xs text-rose-100/70 mt-1">Deleting an account is permanent and removes profile access.</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="px-4 py-2 rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-200 disabled:opacity-70 inline-flex items-center justify-center gap-2"
                >
                  {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deletingAccount ? "Preparing..." : "Delete Account"}
                </button>
              </div>
            </div>
            </div>
          </SettingsCard>

          <div className="glass-panel rounded-xl border border-primary/20 p-4 flex items-start gap-3 text-sm text-muted-foreground">
            <UserRound className="w-5 h-5 text-primary mt-0.5" />
            <p>Profile changes are saved to Supabase and reflected in the dashboard header through the existing avatar sync flow.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
