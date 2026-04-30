"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Check, ChevronsUpDown } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1511497584788-876760111969?w=600&h=600&fit=crop"

interface ProductSelectProps {
  value: string
  onChange: (value: string) => void
  options: { id: string; name: string; image_url: string | null; category: string }[]
}

export function ProductSelect({ value, onChange, options }: ProductSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => options.find((item) => item.id === value) ?? null, [options, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="h-11 w-full sm:w-[360px] px-3 rounded-xl glass-panel border border-primary/20 text-sm text-foreground flex items-center justify-between gap-2"
          role="combobox"
          aria-expanded={open}
        >
          {selected ? (
            <span className="flex items-center gap-2 min-w-0">
              <span className="relative w-7 h-7 rounded-md overflow-hidden border border-primary/20 shrink-0">
                <Image src={selected.image_url ?? FALLBACK_IMAGE} alt={selected.name} fill className="object-cover" />
              </span>
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Search products...</span>
          )}
          <ChevronsUpDown className="w-4 h-4 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[360px] glass-panel border border-primary/20 bg-slate-950/95">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              {options.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.category}`}
                  onSelect={() => {
                    onChange(product.id)
                    setOpen(false)
                  }}
                  className="rounded-lg"
                >
                  <motion.div layout className="flex items-center gap-2 w-full">
                    <span className="relative w-8 h-8 rounded-md overflow-hidden border border-primary/20 shrink-0">
                      <Image src={product.image_url ?? FALLBACK_IMAGE} alt={product.name} fill className="object-cover" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-foreground">{product.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{product.category}</span>
                    </span>
                    <Check className={cn("w-4 h-4 text-primary", value === product.id ? "opacity-100" : "opacity-0")} />
                  </motion.div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
