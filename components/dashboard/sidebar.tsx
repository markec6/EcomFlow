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
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AiNeuralLinkSidebarModal } from "@/components/dashboard/ai-neural-link-sidebar-modal"
import { useSidebarState } from "@/components/dashboard/sidebar-state"

const navItems = [
  { icon: House, ariaLabel: "Dashboard", href: "/dashboard" },
  { icon: Globe, ariaLabel: "Market Intelligence", href: "/market-intelligence" },
  { icon: Gem, ariaLabel: "Vault", href: "/vault" },
  { icon: FlaskConical, ariaLabel: "Lab", href: "/dashboard/lab" },
  { icon: BarChart3, ariaLabel: "Competitor Spy", href: "/competitors" },
  { icon: Settings, ariaLabel: "Settings", href: "/settings" },
]

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const { isMobile, isOpen, toggleSidebar } = useSidebarState()

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
        className={cn(
          "fixed left-0 top-0 h-screen w-[72px] py-4 bg-sidebar/90 max-md:bg-sidebar border-r border-border/70 z-[100] will-change-transform transform-gpu transition-transform duration-200 ease-out overflow-hidden flex flex-col",
          isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none border-transparent"
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
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0 text-current opacity-100" />
            </Link>
          </motion.div>
        ))}
      </nav>

      <div className={cn("absolute bottom-4 left-0 right-0 px-2 transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <AiNeuralLinkSidebarModal />
      </div>
      </aside>
    </>
  )
})
