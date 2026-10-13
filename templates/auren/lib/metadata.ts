import type { Metadata } from "next";

/**
 * Absolute base for Open Graph URLs. Set NEXT_PUBLIC_SITE_URL in production;
 * on Vercel the production domain is picked up automatically.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const SITE_NAME = "Auren";
export const SITE_TAGLINE = "Write the intent. Review the diff.";
export const SITE_DESCRIPTION =
  "Auren is a native code editor with an agent that has read your entire codebase. Describe a change, get back a diff in your conventions, ready to ship.";

/** Title, description and matching social metadata for a page. */
export function pageMeta(title: string, description: string): Metadata {
  const social = `${title} · ${SITE_NAME}`;
  return {
    title,
    description,
    openGraph: { title: social, description, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title: social, description },
  };
}
