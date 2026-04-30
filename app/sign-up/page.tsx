"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignUpAliasPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/signup")
  }, [router])

  return null
}
