import type { MetadataRoute } from "next";
import type { SeoConfig } from "@/lib/seo/types";

const STATIC_LASTMOD = new Date("2026-10-27");

// id 0 = core/static sitemap (MAIN). id 1..N = blog chunks (chunk index = id - 1).
export async function sitemapChunkIds(config: SeoConfig): Promise<{ id: number }[]> {
  const ids = [{ id: 0 }];
  if (!config.blog) return ids;
  let total = 0;
  try {
    total = (await config.blog.getEntries()).length;
  } catch {
    total = 0;
  }
  const chunks = Math.ceil(total / config.blog.chunkSize);
  for (let i = 1; i <= chunks; i++) ids.push({ id: i });
  return ids;
}

export async function buildSitemapChunk(
  config: SeoConfig,
  id: number
): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    return config.staticRoutes.map((r) => ({
      url: `${config.siteUrl}${r.path}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    }));
  }
  if (!config.blog) return [];
  let entries;
  try {
    entries = await config.blog.getEntries();
  } catch {
    return [];
  }
  const start = (id - 1) * config.blog.chunkSize;
  return entries.slice(start, start + config.blog.chunkSize).map((e) => ({
    url: `${config.siteUrl}${config.blog!.basePath}/${e.slug}`,
    lastModified: e.lastModified ? new Date(e.lastModified) : STATIC_LASTMOD,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}

