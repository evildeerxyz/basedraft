import type { MetadataRoute } from "next";

/*
 * Search engines may index the store; nothing may crawl the templates' previews, Studio or the
 * API, and AI crawlers may crawl nothing at all. Polite crawlers follow this; the previews are
 * also guarded in src/proxy.ts for the rest.
 */
const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "CCBot", "Google-Extended", "GoogleOther", "PerplexityBot", "Perplexity-User", "Bytespider", "Amazonbot", "Applebot-Extended", "meta-externalagent", "FacebookBot", "cohere-ai", "Diffbot", "Omgilibot", "ImagesiftBot", "YouBot", "Timpibot", "Kangaroo Bot", "DuckAssistBot", "MistralAI-User", "firecrawl"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_BOTS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/live/", "/view/", "/studio", "/api/", "/dev/"] },
    ],
  };
}
