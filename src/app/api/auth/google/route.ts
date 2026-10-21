import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_COOKIE, googleStart, safeNext, signInFailed } from "@/server/google";

/* Off to Google to choose an account; back at /api/auth/callback/google. */
export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return NextResponse.redirect(signInFailed(req, next, "google-off", "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET isn't set"));
  const { to, saved } = await googleStart(req.nextUrl.origin, next);
  const res = NextResponse.redirect(to);
  res.cookies.set(GOOGLE_COOKIE, saved, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/api/auth", maxAge: 600 });
  return res;
}
