import type { SeoConfig } from "@/lib/seo/types";
import { getPosts } from "@/lib/wordpress";

export const seoConfig: SeoConfig = {
  siteUrl: "https://freettsvoice.com",
  staticRoutes: [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/text-to-speech", priority: 0.9, changeFrequency: "weekly" },
    { path: "/tools", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/about", priority: 0.5, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/acceptable-use", priority: 0.3, changeFrequency: "yearly" },
    { path: "/grievance", priority: 0.3, changeFrequency: "yearly" },
  ],
  blog: {
    basePath: "/blog",
    chunkSize: 1000,
    getEntries: async () => {
      const posts = await getPosts(1000);
      return posts.map((p) => ({ slug: p.slug, lastModified: p.isoDate }));
    },
  },
  robots: {
    disallow: ["/api/", "/login", "/signup", "/pricing"],
  },
  llms: {
    title: "FreeTTSVoice",
    summary:
      "Free AI text-to-speech. Convert text to natural Hindi and Indian English speech and download MP3.",
    sections: [
      {
        heading: "Core pages",
        items: [
          { title: "Text to Speech tool", path: "/text-to-speech" },
          { title: "FAQ", path: "/faq" },
          { title: "About", path: "/about" },
        ],
      },
    ],
  },
};

