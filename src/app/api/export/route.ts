import type { NextRequest } from "next/server";
import { zipBytes } from "@/lib/zip";
import { mayExport, NEEDS_PRO, sameOrigin } from "@/server/guard";
import { siteFiles } from "@/server/site";
import { checkedProject } from "@/studio/state";

/** The whole site for a project, as a zip: the template's code with your pages and text written in. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Not from this site" }, { status: 403 });
  const project = checkedProject(await req.json().catch(() => null));
  if (!project) return Response.json({ error: "That project didn't come through whole. Reload Studio and try again." }, { status: 400 });
  if (!(await mayExport(project.template, req))) return Response.json({ error: NEEDS_PRO }, { status: 402 });
  const { files } = await siteFiles(project);
  const name = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
  // Inside one folder, as a project download usually is.
  const body = zipBytes(Object.fromEntries([...files].map(([k, v]) => [`${name}/${k}`, v])));
  return new Response(body as BodyInit, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}.zip"`, "Cache-Control": "no-store" } });
}
