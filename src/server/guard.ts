import { api } from "@convex/_generated/api";
import type { NextRequest } from "next/server";
import { fetchAuthQuery } from "@/lib/auth-server";

/*
 * Checks for the routes that hand out a template's code.
 */

/**
 * Whether the signed-in person may take this template's code: with Pro or Team, or by having
 * bought it. Everyone else is turned away, signed in or not, in development too.
 * BD_EXPORT_OPEN=1 hands out everything, for a private preview only, and in development the
 * Pro preview (src/site/plan.ts) asks for it with a header. Production ignores the header.
 */
export async function mayExport(template: string, req?: NextRequest) {
  if (process.env.BD_EXPORT_OPEN === "1") return true;
  if (process.env.NODE_ENV !== "production" && req?.headers.get("x-bd-preview") === "pro") return true;
  try {
    return await fetchAuthQuery(api.purchases.owns, { template });
  } catch {
    return false;
  }
}

/** A write from this site's own pages, not a form or script on another site. */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export const NEEDS_PRO = "Code export is in Pro, or comes with buying this template. Sign in with the email you bought with.";
