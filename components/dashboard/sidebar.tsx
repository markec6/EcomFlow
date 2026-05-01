"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import {
  House,
  Globe,
  Gem,
  FlaskConical,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebarState } from "@/components/dashboard/sidebar-state"

const navItems = [
  { icon: House, ariaLabel: "Home", href: "/home" },
  { icon: Globe, ariaLabel: "Market Intelligence", href: "/market-intelligence" },
  { icon: Gem, ariaLabel: "Vault", href: "/vault" },
  { icon: FlaskConical, ariaLabel: "Outreach Lab", href: "#" },
  { icon: BarChart3, ariaLabel: "Competitor Spy", href: "/competitors" },
  { icon: Settings, ariaLabel: "Settings", href: "/settings" },
]

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const { isMobile, isOpen, sidebarWidth, toggleSidebar } = useSidebarState()

  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={toggleSidebar}
          className="fixed inset-0 z-[99] bg-black/35"
        />
      )}
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className={cn(
          "fixed left-0 top-0 h-screen py-4 bg-sidebar/90 max-md:bg-sidebar border-r border-border/70 z-[100] will-change-[width,transform] [transform:translateZ(0)] transition-[width] duration-300 ease-in-out overflow-hidden",
          !isOpen ? "pointer-events-none border-transparent" : "pointer-events-auto"
        )}
      >
      <nav className={cn("flex-1 flex flex-col gap-2 px-2", isOpen ? "mt-12" : "mt-0 opacity-0 pointer-events-none")}>
        {navItems.map((item, index) => (
          <motion.div
            key={item.href}
            initial={isMobile ? false : { x: -20, opacity: 0 }}
            animate={isMobile ? undefined : { x: 0, opacity: 1 }}
            transition={isMobile ? undefined : { delay: index * 0.05, duration: 0.2 }}
            whileHover={isMobile ? undefined : { scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={item.href}
              onClick={() => {
                if (isMobile && isOpen) toggleSidebar()
              }}
              aria-label={item.ariaLabel}
              className={cn(
                "h-11 rounded-xl flex items-center transition-colors duration-200 touch-manipulation min-w-11",
                "justify-center px-0",
                pathname === item.href
                  ? "glass-panel text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
                item.href === "#" && "pointer-events-none opacity-60"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
            </Link>
          </motion.div>
        ))}
      </nav>

      <div className={cn("absolute bottom-4 left-0 right-0 px-2 transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <button
          type="button"
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center glow-violet group transition-all duration-300 hover:scale-110 hover:-translate-y-1 touch-manipulation mx-auto"
          aria-label="AI tools"
        >
          <Sparkles className="w-5 h-5 text-white group-hover:animate-pulse" />
        </button>
      </div>
      </aside>
    </>
  )
})
