import type { NextRequest } from "next/server";
import { PRO_SOURCES } from "@/registry/pro-sources";
import { hasPro, NEEDS_PRO_COMPONENT } from "@/server/guard";

/*
 * A Pro component's source, for Pro and Team accounts only: as JSON for its page's Code view, or
 * as the file itself with ?download=1. Everyone else gets a 402, and the page shows what Pro
 * brings. The free components' files are public at /ui/<name>.tsx; these never are.
 */
export async function GET(req: NextRequest, { params }: RouteContext<"/api/ui/[name]">) {
  const { name } = await params;
  const source = PRO_SOURCES[name];
  if (!source) return Response.json({ error: "There's no Pro component by that name." }, { status: 404 });
  if (!(await hasPro(req))) return Response.json({ error: NEEDS_PRO_COMPONENT }, { status: 402 });
  const headers = { "Cache-Control": "private, no-store" };
  if (req.nextUrl.searchParams.get("download")) return new Response(source, { headers: { ...headers, "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.tsx"` } });
  return Response.json({ source }, { headers });
}
