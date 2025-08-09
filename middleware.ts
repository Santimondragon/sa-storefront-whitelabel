import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Always run Clerk on admin to ensure auth is loaded; page does its own role check
    "/admin(.*)",
    // Clerk also needs to run on api/trpc for server-side actions if needed
    "/api/trpc/:path*",
  ],
};
