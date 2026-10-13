/*
 * Site-wide settings that only the server needs (metadata, sitemap, robots).
 * On Vercel the production URL is picked up automatically; elsewhere set
 * NEXT_PUBLIC_SITE_URL.
 */

/** The public URL of this site, used for social cards, the sitemap and canonical links. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3001"
).replace(/\/$/, "");

export const SITE_NAME = "Noma";
export const SITE_DESCRIPTION = "Noma turns plain English into SQL your team can read, approve and share. Reads run in milliseconds. Writes wait for a human.";
