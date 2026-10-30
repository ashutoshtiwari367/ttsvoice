import type { MetadataRoute } from "next";
import type { SeoConfig } from "@/lib/seo/types";

export function buildRobots(config: SeoConfig): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: config.robots.allow ?? "/",
      disallow: config.robots.disallow,
    },
    sitemap: `${config.siteUrl}/sitemap.xml`,
    host: config.siteUrl,
  };
}

