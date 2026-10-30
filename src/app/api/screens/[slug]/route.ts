import type { NextRequest } from "next/server";
import { SCREEN_PRO_SOURCES } from "@/screens/pro-sources";
import { hasPro, NEEDS_PRO_SCREEN } from "@/server/guard";

/*
 * A Pro screen's file, for Pro and Team accounts only: as JSON for its page's Code view, or as the
 * file itself with ?download=1. Everyone else gets a 402, and the page shows what Pro brings. The
 * free screens' files are public at /ui/screens/<slug>.tsx; these never are.
 */
export async function GET(req: NextRequest, { params }: RouteContext<"/api/screens/[slug]">) {
  const { slug } = await params;
  const source = SCREEN_PRO_SOURCES[slug];
  if (!source) return Response.json({ error: "There's no Pro screen by that name." }, { status: 404 });
  if (!(await hasPro(req))) return Response.json({ error: NEEDS_PRO_SCREEN }, { status: 402 });
  const headers = { "Cache-Control": "private, no-store" };
  if (req.nextUrl.searchParams.get("download")) return new Response(source, { headers: { ...headers, "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}.tsx"` } });
  return Response.json({ source }, { headers });
}
