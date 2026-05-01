"use client"

import { useState } from "react"
import { FlaskConical } from "lucide-react"
import { LazyHeader, LazySidebar } from "@/components/dashboard/lazy-shell"

export default function OutreachLabPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <LazySidebar />
      <LazyHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="relative z-10 pl-[var(--content-offset,0px)] pt-16 transition-[padding] duration-300 ease-in-out">
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          <section className="glass-panel rounded-2xl border border-primary/20 p-6 md:p-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
              <FlaskConical className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Outreach Lab</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Supplier outreach experiments and campaign tooling will live here. Navigation is active, mobile-safe, and ready for the next workflow.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
