export const runtime = 'nodejs'

import { clerkMiddleware } from "@clerk/nextjs/server"

const clerk = clerkMiddleware()

export default function middleware(
  ...args: Parameters<typeof clerk>
) {
  console.log("[middleware]", args[0].method, args[0].nextUrl.pathname)
  return clerk(...args)
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
