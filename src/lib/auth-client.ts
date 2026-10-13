import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/*
 * Better Auth in the browser. It talks to /api/auth on this site, which hands every request on to
 * Better Auth running in Convex, so the session cookie is this site's own.
 */
export const authClient = createAuthClient({
  plugins: [emailOTPClient(), convexClient()],
});
