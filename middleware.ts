export const runtime = 'nodejs'

import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const clerk = clerkMiddleware()

export default async function middleware(
  req: Parameters<typeof clerk>[0],
  event: Parameters<typeof clerk>[1],
) {
  if (req.nextUrl.searchParams.has('__clerk_handshake')) { return NextResponse.next(); }

  console.log("[middleware]", req.method, req.nextUrl.pathname)
  console.log("CLERK KEY EXISTS:", !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

  try {
    return await clerk(req, event)
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
