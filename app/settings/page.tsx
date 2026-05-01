"use client"

import Image from "next/image"
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react"
import { Loader2, Lock, Mail, Shield, Trash2, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { Switch } from "@/components/ui/switch"
import { useAuth, useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { clearClientSessionData, useAiCredits } from "@/hooks/use-ai-credits"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const PROFILE_EVENT = "ecomflow-profile-sync"

type ProfileSettings = {
  full_name: string | null
  public_bio: string | null
  avatar_url: string | null
  theme_preference: "dark" | "light" | null
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
  const { userId: clerkUserId, isSignedIn, signOut } = useAuth()
  const { user } = useUser()
  const { setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [uploading, setUploading] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
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
  const { profile, isGuest, userId: profileId } = useAiCredits()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      const supabase = getSupabaseClient()
      if (!supabase || !isSignedIn || !profileId) {
        setLoadingSettings(false)
        return
      }
      setUserEmail(user?.primaryEmailAddress?.emailAddress ?? null)

      let { data, error } = await supabase
        .from("profiles")
        .select("full_name,public_bio,avatar_url,theme_preference,dark_mode,email_alerts,public_profile")
        .eq("id", profileId)
        .single()

      if (error && String(error.message ?? "").toLowerCase().includes("theme_preference")) {
        const fallback = await supabase
          .from("profiles")
          .select("full_name,public_bio,avatar_url,dark_mode,email_alerts,public_profile")
          .eq("id", profileId)
          .single()
        data = fallback.data
        error = fallback.error
      }

      const settings = data as ProfileSettings | null
      setFullName(settings?.full_name ?? "")
      setPublicBio(settings?.public_bio ?? "")
      setCurrentAvatarUrl(settings?.avatar_url ?? null)
      const persistedTheme = settings?.theme_preference ?? (settings?.dark_mode === false ? "light" : "dark")
      setDarkMode(persistedTheme !== "light")
      setTheme(persistedTheme)
      setEmailAlerts(settings?.email_alerts ?? true)
      setPublicProfile(settings?.public_profile ?? false)
      setLoadingSettings(false)
    }

    void loadSettings()
  }, [isSignedIn, profileId, setTheme, user?.primaryEmailAddress?.emailAddress])

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
    const supabase = getSupabaseClient()
    try {
      if (!supabase || !profileId || !clerkUserId) {
        toast.error("Please log in to update your profile picture.")
        return
      }

      const filePath = `avatars/${clerkUserId}/${Date.now()}-${file.name}`
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
        .upsert({ id: profileId, avatar_url: data.publicUrl }, { onConflict: "id" })
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
    const supabase = getSupabaseClient()
    if (!supabase || !profileId) {
      setSavingInfo(false)
      toast.error("Please log in to update your profile.")
      return
    }

    const profilesTable = supabase.from("profiles") as any
    const { error } = await profilesTable
      .upsert(
        {
          id: profileId,
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
  ): Promise<boolean> => {
    setSavingPreferences(true)
    const supabase = getSupabaseClient()
    if (!supabase || !profileId) {
      setSavingPreferences(false)
      return false
    }

    const profilesTable = supabase.from("profiles") as any
    let { error } = await profilesTable.upsert(
      {
        id: profileId,
        theme_preference: nextDarkMode ? "dark" : "light",
        dark_mode: nextDarkMode,
        email_alerts: nextEmailAlerts,
        public_profile: nextPublicProfile,
      },
      { onConflict: "id" }
    )

    if (error && String(error.message ?? "").toLowerCase().includes("theme_preference")) {
      const fallback = await profilesTable.upsert(
        {
          id: profileId,
          dark_mode: nextDarkMode,
          email_alerts: nextEmailAlerts,
          public_profile: nextPublicProfile,
        },
        { onConflict: "id" }
      )
      error = fallback.error
    }

    setSavingPreferences(false)
    if (error) {
      toast.error("Could not save preferences.")
      return false
    }
    setTheme(nextDarkMode ? "dark" : "light")
    toast.success("Preferences saved.")
    return true
  }

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill current and new password.")
      return
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.")
      return
    }
    if (!user) {
      toast.error("No active account found.")
      return
    }
    setSendingReset(true)
    try {
      await (user as unknown as {
        updatePassword: (params: { currentPassword: string; newPassword: string }) => Promise<void>
      }).updatePassword({
        currentPassword,
        newPassword,
      })
      setCurrentPassword("")
      setNewPassword("")
      setShowChangePasswordForm(false)
      toast.success("Password updated.")
    } catch (error) {
      const message = (error as { errors?: { message?: string }[] } | undefined)?.errors?.[0]?.message
      toast.error(message ?? "Could not change password.")
    } finally {
      setSendingReset(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    const supabase = getSupabaseClient()
    try {
      if (supabase && profileId) {
        const profilesTable = supabase.from("profiles") as any
        await profilesTable.delete().eq("id", profileId)
      }

      if (user) {
        await (user as unknown as { delete: () => Promise<void> }).delete()
      }

      await signOut()
      clearClientSessionData()
      window.localStorage.setItem("guest_credits", "3")
      window.sessionStorage.setItem("guest_credits", "3")
      setConfirmDeleteOpen(false)
      toast.success("Account deleted.")
      router.push("/")
      router.refresh()
    } catch (error) {
      const message = (error as { errors?: { message?: string }[] } | undefined)?.errors?.[0]?.message
      toast.error(message ?? "Could not delete account.")
    } finally {
      setDeletingAccount(false)
    }
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

      <main className="relative z-10 pl-[var(--content-offset,0px)] pt-16 transition-[padding] duration-300 ease-in-out">
        <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage identity, preferences, notifications, and account security.</p>
          </div>

          {isGuest && (
            <div className="glass-panel rounded-xl border border-primary/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Logged-in users can save permanent settings.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-semibold"
              >
                Login
              </button>
            </div>
          )}

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
                    const previous = darkMode
                    setDarkMode(checked)
                    void (async () => {
                      const ok = await savePreferences(checked, emailAlerts, publicProfile)
                      if (!ok) setDarkMode(previous)
                    })()
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
                    const previous = emailAlerts
                    setEmailAlerts(checked)
                    void (async () => {
                      const ok = await savePreferences(darkMode, checked, publicProfile)
                      if (!ok) setEmailAlerts(previous)
                    })()
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
                    const previous = publicProfile
                    setPublicProfile(checked)
                    void (async () => {
                      const ok = await savePreferences(darkMode, emailAlerts, checked)
                      if (!ok) setPublicProfile(previous)
                    })()
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
                      Update your password for {userEmail ?? "your account email"}.
                  </p>
                </div>
              </div>
              <button
                  onClick={() => setShowChangePasswordForm((open) => !open)}
                disabled={sendingReset}
                className="px-4 py-2 rounded-xl border border-primary/30 text-primary disabled:opacity-70 inline-flex items-center justify-center gap-2"
              >
                  <Lock className="w-4 h-4" />
                  {showChangePasswordForm ? "Hide Form" : "Change Password"}
              </button>
            </div>
              {showChangePasswordForm && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                  <input
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    type="password"
                    placeholder="Current Password"
                    className="w-full h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-foreground"
                  />
                  <input
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    type="password"
                    placeholder="New Password"
                    className="w-full h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-foreground"
                  />
                  <button
                    onClick={changePassword}
                    disabled={sendingReset}
                    className="px-4 py-2 rounded-xl bg-primary text-white disabled:opacity-70 inline-flex items-center justify-center gap-2"
                  >
                    {sendingReset && <Loader2 className="w-4 h-4 animate-spin" />}
                    {sendingReset ? "Updating..." : "Update Password"}
                  </button>
                </div>
              )}
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-rose-200">Danger Zone</p>
                  <p className="text-xs text-rose-100/70 mt-1">Deleting an account is permanent and removes profile access.</p>
                </div>
                <button
                  onClick={() => setConfirmDeleteOpen(true)}
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

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="glass-panel border border-rose-400/30 bg-slate-950/95">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete account?</DialogTitle>
            <DialogDescription>
              This will permanently remove your Clerk account and Supabase profile. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirmDeleteOpen(false)}
              className="px-4 py-2 rounded-lg border border-primary/30 text-primary"
              disabled={deletingAccount}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-70 inline-flex items-center gap-2"
            >
              {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
              {deletingAccount ? "Deleting..." : "Yes, delete account"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
