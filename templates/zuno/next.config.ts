import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served by BaseDraft under /live/zuno: every link, asset and pathname is prefixed by Next itself, so the site's code stays as it is.
  basePath: "/live/zuno",
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
