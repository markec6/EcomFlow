"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

type SidebarStateValue = {
  isMobile: boolean
  isOpen: boolean
  sidebarWidth: number
  contentOffset: number
  toggleSidebar: () => void
}

const SidebarStateContext = createContext<SidebarStateValue | null>(null)

export function SidebarStateProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isOpen = isMobile ? mobileOpen : desktopOpen
  const sidebarWidth = isOpen ? 72 : 0
  const contentOffset = isMobile ? 0 : isOpen ? 72 : 0

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileOpen((prev) => !prev)
    } else {
      setDesktopOpen((prev) => !prev)
    }
  }, [isMobile])

  const value = useMemo<SidebarStateValue>(
    () => ({ isMobile, isOpen, sidebarWidth, contentOffset, toggleSidebar }),
    [contentOffset, isMobile, isOpen, sidebarWidth, toggleSidebar]
  )

  return (
    <SidebarStateContext.Provider value={value}>
      <div
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
            "--content-offset": `${contentOffset}px`,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </SidebarStateContext.Provider>
  )
}

export function useSidebarState() {
  const context = useContext(SidebarStateContext)
  if (!context) {
    throw new Error("useSidebarState must be used inside SidebarStateProvider")
  }
  return context
}
