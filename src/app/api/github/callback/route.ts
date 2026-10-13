import { NextResponse, type NextRequest } from "next/server";
import { checkState, exchange, setSession, STATE } from "@/server/github";

/** GitHub sends you back here with a code; it becomes a token, sealed in a cookie only the server reads. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const { ok, back } = checkState(req, q.get("state"));
  const to = (status: string, why?: string) => {
    const u = new URL(back, req.nextUrl.origin);
    u.searchParams.set("github", status);
    if (why) u.searchParams.set("why", why);
    const res = NextResponse.redirect(u);
    res.cookies.set(STATE, "", { path: "/api/github", maxAge: 0 });
    return res;
  };
  if (q.get("error")) return to("cancelled");
  const code = q.get("code");
  if (!ok || !code) return to("error", "That sign-in expired. Try connecting again.");
  try {
    const session = await exchange(code, req.nextUrl.origin);
    const res = to("connected");
    setSession(res, session);
    return res;
  } catch (e) {
    return to("error", e instanceof Error ? e.message : "GitHub didn't connect");
  }
}
