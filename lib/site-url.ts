"use client"

export function getURL(path = "") {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000/"

  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path
  return normalizedPath ? `${url}${normalizedPath}` : url
}
