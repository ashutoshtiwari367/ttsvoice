import type { MetadataRoute } from "next";
import { resolveSiteBaseUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await resolveSiteBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/text-to-speech", "/blog", "/blog/", "/tools", "/about", "/faq", "/help", "/contact"],
        disallow: [
          "/api/",
          "/auth/",
          "/account",
          "/profile",
          "/billing",
          "/settings",
          "/saved-voices",
          "/history",
          "/studio",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

