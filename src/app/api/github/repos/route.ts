import { NextResponse, type NextRequest } from "next/server";
import { clearSession, GitHubError, repos, sessionOf } from "@/server/github";

/** The repositories you can push to. */
export async function GET(req: NextRequest) {
  const s = sessionOf(req);
  if (!s) return Response.json({ error: "Connect GitHub first." }, { status: 401 });
  try {
    return Response.json({ repos: await repos(s.token) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const status = e instanceof GitHubError ? e.status : 502;
    const res = NextResponse.json({ error: e instanceof Error ? e.message : "GitHub didn't answer" }, { status });
    // A revoked token: forget it, so the next step is connecting again.
    if (status === 401) clearSession(res);
    return res;
  }
}
