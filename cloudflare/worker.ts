/*
 * basedraft's Worker on Cloudflare: OpenNext's Next.js worker, with the templates' previews
 * (/live/<slug>, plain files in the asset store) guarded on the way through. Wrangler runs this
 * first only for /live pages (see run_worker_first in wrangler.jsonc); everything else in the
 * asset store is served without it, and everything else goes to Next.
 */
import { NO_AI, previewRedirect } from "../src/lib/preview-guard";
// @ts-ignore: made by `opennextjs-cloudflare build`
import { default as next } from "../.open-next/worker.js";

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  /** The site's one address (basedraft.site); www and workers.dev redirect to it. Empty: no redirect. */
  CANONICAL_HOST?: string;
}
type ExecutionContext = { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    // One address for the site: www.basedraft.site, and the Worker's own workers.dev address, go there.
    if ((env.CANONICAL_HOST && url.hostname !== env.CANONICAL_HOST) || url.hostname.startsWith("www.")) {
      const to = new URL(url);
      to.hostname = env.CANONICAL_HOST || url.hostname.replace(/^www\./, "");
      return Response.redirect(to.toString(), 301);
    }
    if (!url.pathname.startsWith("/live/")) return next.fetch(request, env, ctx);
    const to = previewRedirect(request);
    if (to) return Response.redirect(to.toString(), 307);
    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    out.headers.set("X-Robots-Tag", NO_AI);
    return out;
  },
};
