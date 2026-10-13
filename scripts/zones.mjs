/*
 * The three templates are their own Next apps (zones), served by basedraft under /live/<slug>.
 * One list of where each runs locally, shared by the dev, build and start scripts and by
 * next.config.ts. In production, point ZUNO_URL, NOMA_URL and AUREN_URL at their deployments.
 */
export const ZONES = [
  { slug: "zuno", dir: "templates/zuno", port: 4101, env: "ZUNO_URL" },
  { slug: "noma", dir: "templates/noma", port: 4102, env: "NOMA_URL" },
  { slug: "auren", dir: "templates/auren", port: 4103, env: "AUREN_URL" },
];
