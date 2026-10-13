import { NextResponse, type NextRequest } from "next/server";
import { NO_AI, previewRedirect } from "./lib/preview-guard";

/*
 * The previews' guard under next start (see src/lib/preview-guard.ts). On Cloudflare the previews
 * are plain files and cloudflare/worker.ts guards them; this file isn't part of that build.
 * Development is left alone, so screenshots and tests can open the pages directly.
 */
export function proxy(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const to = previewRedirect(req);
    if (to) return NextResponse.redirect(to, 307);
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", NO_AI);
  return res;
}

export const config = {
  matcher: ["/live/:path*"],
};
