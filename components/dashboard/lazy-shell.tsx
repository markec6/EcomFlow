"use client"

import dynamic from "next/dynamic"

export const LazySidebar = dynamic(() => import("@/components/dashboard/sidebar").then((mod) => mod.Sidebar), {
  loading: () => <div className="fixed left-0 top-0 z-[100] h-screen w-[72px] bg-sidebar/90 border-r border-border/70" />,
  ssr: false,
})

export const LazyHeader = dynamic(() => import("@/components/dashboard/header").then((mod) => mod.Header), {
  loading: () => (
    <div className="fixed top-0 right-0 left-0 z-[100] h-16 glass max-md:bg-card/95 border-b border-border/70 px-3 sm:px-4 md:px-6 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl glass-panel animate-pulse" />
      <div className="h-10 flex-1 max-w-3xl mx-auto rounded-xl glass-panel animate-pulse" />
      <div className="hidden lg:block w-32 h-10 rounded-xl glass-panel animate-pulse" />
    </div>
  ),
  ssr: false,
})

export const LazyStatCards = dynamic(() => import("@/components/dashboard/stat-cards").then((mod) => mod.StatCards), {
  loading: () => <div className="h-24 rounded-xl glass-panel animate-pulse" />,
  ssr: false,
})

export const LazyProductGrid = dynamic(() => import("@/components/dashboard/product-grid").then((mod) => mod.ProductGrid), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="h-[360px] rounded-xl glass-panel border border-primary/20 animate-pulse" />
      ))}
    </div>
  ),
  ssr: false,
})

export const LazyActivitySidebar = dynamic(
  () => import("@/components/dashboard/activity-sidebar").then((mod) => mod.ActivitySidebar),
  {
    loading: () => <div className="h-72 rounded-xl glass-panel animate-pulse" />,
    ssr: false,
  }
)
