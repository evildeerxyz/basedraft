import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served by basedraft under /live/pello: every link, asset and pathname is prefixed by Next itself, so the site's code stays as it is.
  basePath: "/live/pello",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Served by basedraft as plain files on Cloudflare: its deploy builds with BD_STATIC=1.
  ...(process.env.BD_STATIC === "1" ? { output: "export" as const, images: { unoptimized: true }, cacheComponents: false, partialPrefetching: false } : {}),
};

export default nextConfig;
