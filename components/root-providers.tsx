"use client"

import type { ReactNode } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SidebarStateProvider } from "@/components/dashboard/sidebar-state"
import { ProfileBootstrap } from "@/components/auth/profile-bootstrap"
import { SupabaseClerkTokenBridge } from "@/components/auth/supabase-clerk-token-bridge"
import { AiCreditsProvider } from "@/hooks/use-ai-credits"

type RootProvidersProps = {
  children: ReactNode
  publishableKey: string | undefined
}

export function RootProviders({ children, publishableKey }: RootProvidersProps) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <SupabaseClerkTokenBridge />
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AiCreditsProvider>
          <SidebarStateProvider>
            <ProfileBootstrap />
            {children}
          </SidebarStateProvider>
          <Toaster />
        </AiCreditsProvider>
      </ThemeProvider>
    </ClerkProvider>
  )
}
