import { NextResponse, type NextRequest } from "next/server";
import { clearSession } from "@/server/github";
import { sameOrigin } from "@/server/guard";

/** Disconnect GitHub from basedraft. Revoking the app itself is in GitHub's settings. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Not from this site" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  clearSession(res);
  return res;
}
