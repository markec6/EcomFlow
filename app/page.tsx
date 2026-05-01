"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StatCards } from "@/components/dashboard/stat-cards"
import { ProductGrid } from "@/components/dashboard/product-grid"
import { ActivitySidebar } from "@/components/dashboard/activity-sidebar"
import { Filter, SlidersHorizontal } from "lucide-react"

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Main Content Area */}
      <main className="relative z-10 pl-[var(--content-offset,0px)] pt-16 transition-[padding] duration-300 ease-in-out">
        <div className="flex flex-col xl:flex-row">
          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6 max-w-full xl:max-w-[calc(100%-320px)]">
            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <StatCards />
            </motion.div>

            {/* Product Discovery Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Product Discovery</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-curated winning products for your store
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-panel soft-hover flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-panel soft-hover flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Sort
                  </motion.button>
                </div>
              </div>

              {/* Product Grid */}
              <ProductGrid searchQuery={searchQuery} />
            </motion.div>
          </div>

          {/* Right Activity Sidebar */}
          <div className="w-full xl:w-80 p-4 md:p-6 xl:pl-0 pt-0 xl:pt-6">
            <ActivitySidebar />
          </div>
        </div>
      </main>

      {/* Background Gradient Effects */}
      <div className="fixed inset-0 pointer-events-none -z-0 max-md:hidden">
        <motion.div
          className="absolute -top-28 left-1/4 w-[30rem] h-[30rem] rounded-full blur-[130px] bg-violet-500/20"
          animate={{ x: [0, 40, -20, 0], y: [0, -20, 25, 0] }}
          transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10rem] right-1/4 w-[32rem] h-[32rem] rounded-full blur-[140px] bg-indigo-500/20"
          animate={{ x: [0, -35, 18, 0], y: [0, 12, -18, 0] }}
          transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-[45%] w-[24rem] h-[24rem] rounded-full blur-[120px] bg-blue-500/10"
          animate={{ opacity: [0.3, 0.6, 0.35] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  )
}
