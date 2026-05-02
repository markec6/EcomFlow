"use client"

import useSWR from "swr"
import { fetchProductsFromSupabase, type ProductRecord } from "@/lib/products-engine"

type UseProductsOptions = {
  limit?: number
  includeCompetitors?: boolean
  includeAiCopyVariations?: boolean
}

const DEFAULT_LIMIT = 24

export function useProducts(options: UseProductsOptions = {}) {
  const {
    limit = DEFAULT_LIMIT,
    includeCompetitors = true,
    includeAiCopyVariations = true,
  } = options

  const { data, error, isLoading, isValidating, mutate } = useSWR<ProductRecord[]>(
    ["products", limit, includeCompetitors, includeAiCopyVariations],
    () => fetchProductsFromSupabase({ limit, includeCompetitors, includeAiCopyVariations }),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
      keepPreviousData: true,
    }
  )

  return {
    products: data ?? [],
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
