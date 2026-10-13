import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served by BaseDraft under /live/noma: every link, asset and pathname is prefixed by Next itself, so the site's code stays as it is.
  basePath: "/live/noma",
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
};

export default nextConfig;
