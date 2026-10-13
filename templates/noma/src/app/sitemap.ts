import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const ROUTES = ["", "/product", "/pricing", "/customers", "/company", "/changelog", "/contact", "/blog/series-b", "/security", "/status", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "/changelog" || route === "/status" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
