import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

const ROUTES = ["", "/product", "/pricing", "/customers", "/company", "/careers", "/blog", ...POSTS.map((p) => `/blog/${p.slug}`), "/security", "/contact", "/legal/privacy", "/legal/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route.startsWith("/blog") ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
