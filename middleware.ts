import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher(["/", "/login(.*)", "/signup(.*)", "/sign-up(.*)"])

export default clerkMiddleware(async (_auth, request) => {
  if (isPublicRoute(request)) return
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
