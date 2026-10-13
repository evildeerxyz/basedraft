import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl, configured, keepState, newState, safeReturn } from "@/server/github";

/** Connect GitHub: off to GitHub's consent screen, and back to where you were in Studio. */
export async function GET(req: NextRequest) {
  if (!configured()) return Response.json({ error: "GitHub isn't set up on this site yet." }, { status: 501 });
  const state = newState();
  const res = NextResponse.redirect(authorizeUrl(req.nextUrl.origin, state));
  keepState(res, state, safeReturn(req.nextUrl.searchParams.get("return")));
  return res;
}
