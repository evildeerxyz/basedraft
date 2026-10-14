/*
 * The templates are their own Next apps (zones), served by basedraft under /live/<slug>. One
 * list of where each runs locally, shared by the dev, build and start scripts and by
 * next.config.ts. In production, point ZUNO_URL, NOMA_URL, AUREN_URL and PELLO_URL at their
 * deployments.
 *
 * A zone marked `unreleased` is there in development (next dev, Studio, the store) and left out
 * of every production build and deploy: basedraft.site doesn't list, preview or hand it out.
 * Take the mark off to ship it.
 */
export const ZONES = [
  { slug: "zuno", dir: "templates/zuno", port: 4101, env: "ZUNO_URL" },
  { slug: "noma", dir: "templates/noma", port: 4102, env: "NOMA_URL" },
  { slug: "auren", dir: "templates/auren", port: 4103, env: "AUREN_URL" },
  { slug: "pello", dir: "templates/pello", port: 4104, env: "PELLO_URL", unreleased: true },
];

/** The zones a production build ships. */
export const RELEASED = ZONES.filter((z) => !z.unreleased);
