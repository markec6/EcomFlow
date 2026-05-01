"use client"

import dynamic from "next/dynamic"

export const LazySidebar = dynamic(() => import("@/components/dashboard/sidebar").then((mod) => mod.Sidebar), {
  loading: () => null,
  ssr: false,
})

export const LazyHeader = dynamic(() => import("@/components/dashboard/header").then((mod) => mod.Header), {
  loading: () => null,
  ssr: false,
})

export const LazyStatCards = dynamic(() => import("@/components/dashboard/stat-cards").then((mod) => mod.StatCards), {
  loading: () => <div className="h-24 rounded-xl glass-panel animate-pulse" />,
  ssr: false,
})

export const LazyProductGrid = dynamic(() => import("@/components/dashboard/product-grid").then((mod) => mod.ProductGrid), {
  loading: () => <div className="h-72 rounded-xl glass-panel animate-pulse" />,
  ssr: false,
})

export const LazyActivitySidebar = dynamic(
  () => import("@/components/dashboard/activity-sidebar").then((mod) => mod.ActivitySidebar),
  {
    loading: () => <div className="h-72 rounded-xl glass-panel animate-pulse" />,
    ssr: false,
  }
)
