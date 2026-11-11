import type { NextConfig } from "next";
import { TEMPLATE_GLOBS } from "./scripts/template-source.mjs";
import { RELEASED, ZONES as ALL_ZONES } from "./scripts/zones.mjs";

/* The template zones: every one in development, only the released ones in a production build. */
const ZONES = process.env.NODE_ENV === "production" ? RELEASED : ALL_ZONES;
/* Where each template zone runs: its deployment in production, its local port otherwise. */
const zoneUrl = (z: (typeof ZONES)[number]) => process.env[z.env] ?? `http://localhost:${z.port}`;

const nextConfig: NextConfig = {
  // The routes that hand out a template's code read it from templates/ as they run; see scripts/template-source.mjs.
  outputFileTracingIncludes: { "/api/export": TEMPLATE_GLOBS, "/api/github/push": TEMPLATE_GLOBS },
  // The templates are their own Next apps; these send /live/<slug> to them, so they share BaseDraft's address.
  async rewrites() {
    const noma = ZONES.find((z) => z.slug === "noma")!;
    return [
      ...ZONES.flatMap((z) => [
        { source: `/live/${z.slug}`, destination: `${zoneUrl(z)}/live/${z.slug}` },
        { source: `/live/${z.slug}/:path+`, destination: `${zoneUrl(z)}/live/${z.slug}/:path+` },
      ]),
      // Noma's portraits load from an absolute /people/ path, outside its base path; its files live under it.
      { source: "/people/:path*", destination: `${zoneUrl(noma)}/live/noma/people/:path*` },
      // PostHog, on basedraft's own address (see src/instrumentation-client.ts).
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  // The template sections moved from /components to /blocks when /components became the copy-and-paste library; old links follow them.
  // And basedraft went open source, so the pages for buying it lead home: everything is free now.
  async redirects() {
    const kinds = ["nav", "hero", "logos", "story", "features", "steps", "interactive", "stats", "testimonials", "security", "pricing", "faq", "changelog", "cta", "divider", "footer"];
    return [
      ...kinds.map((k) => ({ source: `/components/${k}`, destination: `/blocks/${k}`, permanent: true })),
      ...["/pro", "/purchases", "/team", "/checkout", "/invite/:token*"].map((source) => ({ source, destination: "/", permanent: false })),
    ];
  },
  // PostHog's API paths end in a slash; redirecting them would drop the events.
  skipTrailingSlashRedirect: true,
  // Text and data mining is reserved (the EU's TDM opt-out, also in /.well-known/tdmrep.json),
  // and the previews and Studio stay out of search and AI indexes.
  async headers() {
    const noAi = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex, noai, noimageai" };
    return [
      { source: "/:path*", headers: [{ key: "tdm-reservation", value: "1" }, { key: "tdm-policy", value: "https://basedraft.site/pro#license" }] },
      { source: "/view/:path*", headers: [noAi] },
      { source: "/studio/:path*", headers: [noAi] },
    ];
  },
  // In development, Next's route badge sits bottom left, clear of Studio's Export button and toolbars.
  devIndicators: { position: "bottom-left" },
  // The home page's Studio tour is drawn at 85, sharper than the default for screenshots of text.
  // On Cloudflare (BD_CF=1) images are served as they are: the shots are already sized JPGs.
  images: { qualities: [75, 85], ...(process.env.BD_CF === "1" ? { unoptimized: true } : {}) },
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
