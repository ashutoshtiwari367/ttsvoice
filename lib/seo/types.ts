import type { MetadataRoute } from "next";

export type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"];

export interface StaticRoute {
  path: string;
  priority?: number;
  changeFrequency?: ChangeFreq;
}

export interface BlogEntry {
  slug: string;
  lastModified?: string;
}

export interface SeoConfig {
  siteUrl: string;
  staticRoutes: StaticRoute[];
  blog?: {
    basePath: string;
    chunkSize: number;
    getEntries: () => Promise<BlogEntry[]>;
  };
  robots: {
    disallow: string[];
    allow?: string | string[];
  };
  llms?: {
    title: string;
    summary: string;
    sections: { heading: string; items: { title: string; path: string; note?: string }[] }[];
  };
}

