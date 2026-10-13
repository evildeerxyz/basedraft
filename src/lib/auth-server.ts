import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

/*
 * Better Auth on the server: /api/auth is passed through to the Convex deployment, and server code
 * can read the session's Convex token or call Convex as the signed-in user.
 */
export const { handler, getToken, isAuthenticated, preloadAuthQuery, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
