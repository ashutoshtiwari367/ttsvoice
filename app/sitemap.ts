import type { MetadataRoute } from "next";
import { seoConfig } from "@/seo.config";
import { sitemapChunkIds, buildSitemapChunk } from "@/lib/seo/sitemap";

export const revalidate = 3600;

export async function generateSitemaps(): Promise<{ id: number }[]> {
  return sitemapChunkIds(seoConfig);
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  // In Next 15, `/sitemap.xml` calls `sitemap({ id: undefined })` while `/sitemap/0.xml` passes `"0"`.
  // Default `undefined` to 0 so `/sitemap.xml` returns the main routes instead of an empty <urlset>.
  const numericId = id == null ? 0 : Number(id);
  return buildSitemapChunk(seoConfig, Number.isNaN(numericId) ? 0 : numericId);
}
