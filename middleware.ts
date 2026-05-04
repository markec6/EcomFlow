import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

/**
 * Routes that never require a Clerk session (sign-in flows, Clerk webhooks, etc.).
 * No database / Supabase calls — Edge-safe.
 */
const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/sign-up(.*)",
  "/auth/callback(.*)",
  "/api/webhooks(.*)",
])

/**
 * Clerk session + route protection only.
 * - HTML / RSC: optional session (guest-friendly); auth pages stay public.
 * - /api/* (except webhooks): requires a signed-in user (401-style when unsigned via protect).
 */
export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  if (isPublicRoute(request)) {
    return
  }

  if (pathname.startsWith("/api/")) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Clerk + Next.js recommended pattern: skip internals & static files (incl. .json via js(?!on))
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
