import type { NextRequest } from "next/server";
import { zipBytes } from "@/lib/zip";
import { sameOrigin } from "@/server/guard";
import { frameworkOf, pageFiles, siteFiles } from "@/server/site";
import { checkedProject } from "@/studio/state";

/**
 * The whole site for a project, as a zip: the template's code with your pages and text written in.
 * ?framework=astro packs its Astro version. ?page=<id> answers with just that page's files, as JSON,
 * for Studio to show.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Not from this site" }, { status: 403 });
  const project = checkedProject(await req.json().catch(() => null));
  if (!project) return Response.json({ error: "That project didn't come through whole. Reload Studio and try again." }, { status: 400 });
  const q = req.nextUrl.searchParams;
  const framework = frameworkOf(q.get("framework"));
  const { files } = await siteFiles(project, framework);
  const one = q.get("page") ? project.pages.find((p) => p.id === q.get("page")) : null;
  if (one) return Response.json({ files: Object.fromEntries(pageFiles(one, framework).map((f) => [f, files.get(f) ?? ""])) }, { headers: { "Cache-Control": "no-store" } });
  const name = (project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site") + (framework === "astro" ? "-astro" : "");
  // Inside one folder, as a project download usually is.
  const body = zipBytes(Object.fromEntries([...files].map(([k, v]) => [`${name}/${k}`, v])));
  return new Response(body as BodyInit, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}.zip"`, "Cache-Control": "no-store" } });
}
