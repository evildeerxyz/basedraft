/*
 * basedraft on Cloudflare Workers (the free plan): pages prerendered at build are served from
 * Workers' static assets, with no revalidation and no paid storage. See scripts/cf-deploy.mjs.
 */
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

const config = defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
// Minified, the worker fits the free plan's 3 MB with room to spare.
config.default.minify = true;

export default config;
