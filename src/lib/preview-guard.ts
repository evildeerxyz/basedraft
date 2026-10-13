/*
 * The templates' live previews (/live/<slug>) are drawn only inside basedraft: in Studio, on the
 * site, and on /view/<slug>. A page asked for on its own, which is what scrapers and "clone this
 * site" tools do, goes to /view/<slug> instead, whose markup is a frame and a price, not the
 * template. Scripts, styles, images and the frames' own requests pass as usual.
 *
 * Used by src/proxy.ts (next start) and cloudflare/worker.ts (Cloudflare, where the previews are
 * plain files). It's a deterrent, not a lock: anything a browser shows can be copied by someone
 * determined enough; with Cloudflare's bot protection in front, it stops the cheap copies.
 */

export const NO_AI = "noindex, nofollow, noarchive, noimageindex, noai, noimageai";

/** Where a request for a preview should go instead, or null when it may have the page. */
export function previewRedirect(req: Request): URL | null {
  const url = new URL(req.url);
  const dest = req.headers.get("sec-fetch-dest");
  const site = req.headers.get("sec-fetch-site");
  const referer = req.headers.get("referer");
  let sameOrigin = site === "same-origin";
  if (!site && referer) {
    try {
      sameOrigin = new URL(referer).origin === url.origin;
    } catch {
      sameOrigin = false;
    }
  }
  // Every current browser says what it's fetching. Without that (curl, a scraper), anything that
  // isn't a static file counts as the page itself, and only passes when basedraft sent it.
  const file = /\/_next\/|\.[a-z0-9]{2,5}$/i.test(url.pathname) && !/\.(html|txt)$/i.test(url.pathname);
  const page = dest ? dest === "document" : !file;
  const framed = dest ? dest === "iframe" && sameOrigin : sameOrigin;
  // React Server Component data for a page is the page too: only for the frames' own navigation.
  const rsc = req.headers.get("rsc") === "1" || /\.txt$/i.test(url.pathname);
  if (!((page && !framed) || (rsc && !sameOrigin))) return null;
  const [, , slug, ...rest] = url.pathname.split("/");
  const path = rest.length && rest[0] !== "bd" ? `/${rest.join("/").replace(/\.(html|txt)$/, "")}` : "/";
  const to = new URL(`/view/${slug}`, url);
  if (path !== "/") to.searchParams.set("path", path);
  return to;
}
