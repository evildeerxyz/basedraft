import { NextResponse, type NextRequest } from "next/server";

/*
 * The templates' live previews (/live/<slug>) are drawn only inside basedraft: in Studio, on the
 * site, and on /view/<slug>. A page asked for on its own, which is what scrapers and "clone this
 * site" tools do, goes to /view/<slug> instead, whose markup is a frame and a price, not the
 * template. Scripts, styles, images and the frames' own requests pass as usual.
 *
 * It's a deterrent, not a lock: anything a browser shows can be copied by someone determined
 * enough. With Cloudflare's bot protection and rate limits in front, it stops the cheap copies.
 * Development is left alone, so screenshots and tests can open the pages directly.
 */

const NO_AI = "noindex, nofollow, noarchive, noimageindex, noai, noimageai";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", NO_AI);
  if (process.env.NODE_ENV !== "production") return res;

  const dest = req.headers.get("sec-fetch-dest");
  const site = req.headers.get("sec-fetch-site");
  const referer = req.headers.get("referer");
  const sameOrigin = site ? site === "same-origin" : Boolean(referer && new URL(referer).origin === req.nextUrl.origin);
  // Every current browser says what it's fetching. Without that (curl, a scraper), anything that
  // isn't a static file counts as the page itself, and only passes when basedraft sent it.
  const file = /\/_next\/|\.[a-z0-9]{2,5}$/i.test(req.nextUrl.pathname);
  const page = dest ? dest === "document" : !file;
  const framed = dest ? dest === "iframe" && sameOrigin : sameOrigin;
  // React Server Component data for a page is the page too: only for the frames' own navigation.
  const rsc = req.headers.get("rsc") === "1";
  if ((page && !framed) || (rsc && !sameOrigin)) {
    const [, , slug, ...rest] = req.nextUrl.pathname.split("/");
    const path = rest.length && rest[0] !== "bd" ? `/${rest.join("/")}` : "/";
    const to = new URL(`/view/${slug}`, req.url);
    if (path !== "/") to.searchParams.set("path", path);
    return NextResponse.redirect(to, 307);
  }
  return res;
}

export const config = {
  matcher: ["/live/:path*"],
};
