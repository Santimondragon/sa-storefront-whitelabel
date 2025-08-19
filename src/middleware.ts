import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only protect admin section; everything else (including tRPC/cart) is public
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run middleware only for admin; avoid running on api/trpc or general pages
    "/admin(.*)",
  ],
};