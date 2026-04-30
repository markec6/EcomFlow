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
import { useIsMobile } from "@/hooks/use-mobile"

const navItems = [
  { icon: House, label: "Home", href: "/home" },
  { icon: Globe, label: "Market Intelligence", href: "/market-intelligence" },
  { icon: Gem, label: "Vault", href: "/vault" },
  { icon: FlaskConical, label: "Outreach Lab", href: "#" },
  { icon: BarChart3, label: "Competitor Spy", href: "/competitors" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  return (
    <aside className="fixed left-0 top-0 h-screen w-14 sm:w-16 flex flex-col items-center py-6 bg-sidebar/90 max-md:bg-sidebar border-r border-border/70 z-50 will-change-transform [transform:translateZ(0)]">
      {/* Logo */}
      <motion.div
        initial={isMobile ? false : { scale: 0.8, opacity: 0 }}
        animate={isMobile ? undefined : { scale: 1, opacity: 1 }}
        className="mb-8"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center glow-violet">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={isMobile ? false : { x: -20, opacity: 0 }}
            animate={isMobile ? undefined : { x: 0, opacity: 1 }}
            transition={isMobile ? undefined : { delay: index * 0.05, duration: 0.2 }}
            whileHover={isMobile ? undefined : { scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={item.href}
              title={item.label}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200 touch-manipulation",
                pathname === item.href
                  ? "glass-panel text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
                item.href === "#" && "pointer-events-none opacity-60"
              )}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* Upgrade Card */}
      <motion.div
        initial={isMobile ? false : { y: 20, opacity: 0 }}
        animate={isMobile ? undefined : { y: 0, opacity: 1 }}
        transition={isMobile ? undefined : { delay: 0.3 }}
        className="mt-auto"
      >
        <button className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center glow-violet group transition-all duration-300 hover:scale-110 hover:-translate-y-1 touch-manipulation">
          <Sparkles className="w-5 h-5 text-white group-hover:animate-pulse" />
        </button>
      </motion.div>
    </aside>
  )
})
