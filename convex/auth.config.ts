import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

// Convex trusts the tokens Better Auth issues, so queries and mutations know who's signed in.
export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
