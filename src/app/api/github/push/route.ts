import { NextResponse, type NextRequest } from "next/server";
import { clearSession, GitHubError, send, sessionOf, type Target } from "@/server/github";
import { mayExport, NEEDS_PRO, sameOrigin } from "@/server/guard";
import { frameworkOf } from "@/server/site";
import { checkedProject } from "@/studio/state";

/** Sends a project to a new repository, or to one you have as a pull request. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Not from this site" }, { status: 403 });
  const s = sessionOf(req);
  if (!s) return Response.json({ error: "Connect GitHub first." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { project?: unknown; target?: Target; framework?: unknown } | null;
  const project = checkedProject(body?.project);
  const t = body?.target;
  const target: Target | null =
    t?.kind === "new" && typeof t.name === "string" ? { kind: "new", name: t.name.trim(), private: t.private !== false } : t?.kind === "existing" && typeof t.repo === "string" ? { kind: "existing", repo: t.repo, direct: t.direct === true } : null;
  if (!project || !target) return Response.json({ error: "That project didn't come through whole. Reload Studio and try again." }, { status: 400 });
  if (!(await mayExport(project.template, req))) return Response.json({ error: NEEDS_PRO }, { status: 402 });
  try {
    return Response.json(await send(s.token, project, target, frameworkOf(body?.framework)));
  } catch (e) {
    const status = e instanceof GitHubError ? e.status : 500;
    const res = NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong on the way to GitHub" }, { status });
    if (status === 401) clearSession(res);
    return res;
  }
}
