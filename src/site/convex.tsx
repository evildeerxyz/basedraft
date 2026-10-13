"use client";

import { ConvexBetterAuthProvider, type AuthClient } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

/*
 * Convex for the whole site, signed in as whoever Better Auth says is signed in. Without a Convex
 * address (a checkout that hasn't set one up) the site still runs; accounts just can't sign in.
 */
const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;
// The component types its client loosely, and Better Auth 1.6 types useSession() precisely; it's
// the same object either way.
const client = authClient as unknown as AuthClient;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) return children;
  return (
    <ConvexBetterAuthProvider client={convex} authClient={client}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
