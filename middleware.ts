import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher([
  "/settings(.*)",
])

export default clerkMiddleware(async (auth, request) => {
  if (!isProtectedRoute(request)) {
    return NextResponse.next()
  }

  try {
    await auth.protect()
    return NextResponse.next()
  } catch (error) {
    console.error("Protected route auth failed:", error)
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect_url", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ["/settings/:path*"],
}
