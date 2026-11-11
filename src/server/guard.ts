import type { NextRequest } from "next/server";

/*
 * Checks for the routes that write. basedraft is free and open source: every template's code goes
 * to anyone, so the only check left is that a write comes from this site's own pages.
 */

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
