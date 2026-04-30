"use client"

export function getURL(path = "") {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

  url = url.includes("http") ? url : `https://${url}`
  url = url.endsWith("/") ? url : `${url}/`

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path
  return `${url}${normalizedPath}`
}
