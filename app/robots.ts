import type { MetadataRoute } from "next";
import { seoConfig } from "@/seo.config";
import { buildRobots } from "@/lib/seo/robots";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(seoConfig);
}
