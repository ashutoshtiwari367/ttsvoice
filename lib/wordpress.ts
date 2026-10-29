const WP_URL = (
  process.env.WORDPRESS_URL ||
  process.env.NEXT_PUBLIC_WORDPRESS_URL ||
  "https://olistoolblogs.tech"
)
  .trim()
  .replace(/\/+$/, "");

export interface WPPost {
  id: number;
  slug: string;
  date: string;
  isoDate: string;
  isoModified: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featuredImage: string | null;
  authorName: string;
  authorAvatar: string | null;
  authorBio: string;
  category: string;
  categorySlug: string;
  readingTime: string;
}

export interface WPSitemapPost {
  id: number;
  slug: string;
  isoDate: string;
  isoModified: string;
}

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// Short in-memory deduplication & stale-if-error fallback cache so live WordPress changes
// sync within seconds while protecting against transient network timeouts.
const MEMORY_TTL_MS = 15_000; // 15 seconds fresh window, cleared instantly via /api/blog/sync
let postsMemoryCache: { limit: number; at: number; posts: WPPost[] } | null = null;
const slugMemoryCache = new Map<string, { at: number; post: WPPost }>();
let sitemapMemoryCache: { at: number; items: WPSitemapPost[] } | null = null;

export function clearWordPressCache(): void {
  postsMemoryCache = null;
  slugMemoryCache.clear();
  sitemapMemoryCache = null;
}

export function getWordPressBaseUrl(): string {
  return WP_URL;
}

/**
 * Strips HTML tags and decodes common WordPress HTML entities cleanly.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;|&#038;/gi, "&")
    .replace(/&quot;|&#8220;|&#8221;/gi, '"')
    .replace(/&#039;|&apos;|&#8216;|&#8217;/gi, "'")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&hellip;|&#8230;/gi, "...")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function toValidIsoDate(gmtDate?: string | null, localDate?: string | null): string {
  if (gmtDate && typeof gmtDate === "string") {
    const normalized = gmtDate.endsWith("Z") ? gmtDate : `${gmtDate}Z`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (localDate && typeof localDate === "string") {
    const parsed = new Date(localDate);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

/**
 * Fetches JSON from WordPress REST API with automatic fallback from `/wp-json/wp/v2/...`
 * to `/?rest_route=/wp/v2/...` (handles LiteSpeed/Cloudflare/permalink edge cases) and
 * bypasses stale Next.js fetch cache so newly published/edited posts sync live.
 */
async function fetchWpJson(
  endpointPath: string,
  params: Record<string, string | number>,
  timeoutMs = 10_000
): Promise<{ ok: boolean; status: number; data: any; headers: Headers | null }> {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    search.set(k, String(v));
  }

  // Primary pretty REST URL + fallback query-param REST URL
  const candidateUrls = [
    `${WP_URL}/wp-json${endpointPath}?${search.toString()}`,
    `${WP_URL}/?rest_route=${encodeURIComponent(endpointPath)}&${search.toString()}`,
  ];

  for (const url of candidateUrls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "User-Agent": "Mozilla/5.0 (compatible; FreeTTSVoice-CMS-Sync/1.5)",
        },
      });

      if (!res.ok) {
        continue;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json")) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          return { ok: true, status: res.status, data: parsed, headers: res.headers };
        } catch {
          continue;
        }
      }

      const data = await res.json();
      return { ok: true, status: res.status, data, headers: res.headers };
    } catch {
      // Try fallback URL next
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return { ok: false, status: 502, data: null, headers: null };
}

function mapWpPost(post: any, dateStyle: "short" | "long" = "short"): WPPost {
  const isoDate = toValidIsoDate(post.date_gmt, post.date);
  const isoModified = toValidIsoDate(
    post.modified_gmt || post.date_gmt,
    post.modified || post.date
  );

  return {
    id: Number(post.id),
    slug: String(post.slug || "").trim(),
    date: new Date(isoDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: dateStyle === "long" ? "long" : "short",
      year: "numeric",
    }),
    isoDate,
    isoModified,
    title: post.title || { rendered: "Untitled" },
    content: post.content || { rendered: "" },
    excerpt: post.excerpt || { rendered: "" },
    featuredImage:
      post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
      post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.large
        ?.source_url ||
      post.jetpack_featured_media_url ||
      null,
    authorName: post._embedded?.author?.[0]?.name || "Editorial Team",
    authorAvatar:
      post._embedded?.author?.[0]?.avatar_urls?.["96"] ||
      post._embedded?.author?.[0]?.avatar_urls?.["48"] ||
      null,
    authorBio: post._embedded?.author?.[0]?.description || "",
    category: post._embedded?.["wp:term"]?.[0]?.[0]?.name || "Articles",
    categorySlug: post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "articles",
    readingTime: calculateReadingTime(post.content?.rendered || ""),
  };
}

export function parseHeadingsAndInjectIds(contentHtml: string): {
  html: string;
  toc: TOCItem[];
} {
  if (!contentHtml) return { html: "", toc: [] };

  const toc: TOCItem[] = [];
  const slugCounts = new Map<string, number>();
  let hasHeadings = false;

  let html = contentHtml.replace(
    /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, levelStr, attrs, innerHtml) => {
      hasHeadings = true;
      const level = parseInt(levelStr, 10);
      const cleanText = stripHtml(innerHtml);
      if (!cleanText) return match;

      let baseSlug = cleanText
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      if (!baseSlug) {
        baseSlug = `section-${toc.length + 1}`;
      }

      const count = slugCounts.get(baseSlug) || 0;
      slugCounts.set(baseSlug, count + 1);
      const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;

      toc.push({
        id,
        text: cleanText,
        level: Math.min(3, Math.max(2, level)),
      });

      if (/id=["'][^"']*["']/i.test(attrs)) {
        return `<h${level}${attrs}>${innerHtml}</h${level}>`;
      }

      return `<h${level} id="${id}" class="scroll-mt-28" ${attrs}>${innerHtml}</h${level}>`;
    }
  );

  // If the article has NO <h1-h6> tags, extract logical anchor points from paragraphs so TOC is always visible
  if (!hasHeadings) {
    const pRegex = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
    const pMatches = Array.from(contentHtml.matchAll(pRegex));

    if (pMatches.length > 0) {
      const step = Math.max(1, Math.floor(pMatches.length / 5));
      const targetIndices = new Set<number>();
      for (let i = 0; i < pMatches.length; i += step) {
        targetIndices.add(i);
      }
      if (pMatches.length > 1) {
        targetIndices.add(pMatches.length - 1);
      }

      let pIndex = 0;
      html = contentHtml.replace(
        /<p([^>]*)>([\s\S]*?)<\/p>/gi,
        (match, attrs, innerHtml) => {
          const curIdx = pIndex++;
          if (targetIndices.has(curIdx)) {
            const rawText = stripHtml(innerHtml);
            let title = rawText.split(/[.?!]/)[0].trim();
            if (title.length > 42) {
              title = title.slice(0, 40).replace(/\s+\S*$/, "") + "...";
            }
            if (!title) title = `Overview Part ${toc.length + 1}`;
            const id = `topic-${toc.length + 1}`;

            toc.push({
              id,
              text: title,
              level: 2,
            });

            return `<p id="${id}" class="scroll-mt-28" ${attrs}>${innerHtml}</p>`;
          }
          return match;
        }
      );
    }
  }

  return { html, toc };
}

function calculateReadingTime(content: string): string {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Fetches live published WordPress blog posts (supports >100 posts via automatic pagination if needed).
 */
export async function getPosts(
  limit: number = 24,
  options?: { forceFresh?: boolean }
): Promise<WPPost[]> {
  const safeLimit = Math.max(1, Math.min(100, limit));
  const now = Date.now();

  if (
    !options?.forceFresh &&
    postsMemoryCache &&
    postsMemoryCache.limit >= safeLimit &&
    now - postsMemoryCache.at < MEMORY_TTL_MS
  ) {
    return postsMemoryCache.posts.slice(0, safeLimit);
  }

  const res = await fetchWpJson("/wp/v2/posts", {
    _embed: 1,
    status: "publish",
    orderby: "date",
    order: "desc",
    per_page: safeLimit,
  });

  if (!res.ok || !Array.isArray(res.data)) {
    console.warn(`[WordPress] Failed to sync posts (status ${res.status})`);
    // Serve last known good snapshot if WordPress experiences a temporary hiccup
    return postsMemoryCache ? postsMemoryCache.posts.slice(0, safeLimit) : [];
  }

  const mapped = res.data
    .filter((p: any) => p && p.slug)
    .map((p: any) => mapWpPost(p, "short"));

  postsMemoryCache = { limit: safeLimit, at: now, posts: mapped };
  for (const post of mapped) {
    slugMemoryCache.set(post.slug.toLowerCase(), { at: now, post });
  }

  return mapped;
}

/**
 * Fetches a single WordPress post by slug, always syncing latest edits from WordPress.
 */
export async function getPostBySlug(
  slug: string,
  options?: { forceFresh?: boolean }
): Promise<WPPost | null> {
  const cleanSlug = decodeURIComponent(slug || "").trim().toLowerCase();
  if (!cleanSlug) return null;

  const now = Date.now();
  const cached = slugMemoryCache.get(cleanSlug);
  if (!options?.forceFresh && cached && now - cached.at < MEMORY_TTL_MS) {
    return cached.post;
  }

  const res = await fetchWpJson("/wp/v2/posts", {
    slug: cleanSlug,
    status: "publish",
    _embed: 1,
  });

  if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
    const mapped = mapWpPost(res.data[0], "long");
    slugMemoryCache.set(cleanSlug, { at: now, post: mapped });
    return mapped;
  }

  // Fallback: check recent posts list in case of Unicode/encoded slug differences
  const recent = await getPosts(30, options);
  const matched = recent.find(
    (p) =>
      p.slug.toLowerCase() === cleanSlug ||
      decodeURIComponent(p.slug).toLowerCase() === cleanSlug
  );
  if (matched) {
    slugMemoryCache.set(cleanSlug, { at: now, post: matched });
    return matched;
  }

  // Last-resort stale fallback if network failed
  if (!res.ok && cached) {
    return cached.post;
  }

  return null;
}

/**
 * Fetches ALL published WordPress post slugs & modification timestamps across pages
 * using lightweight `_fields` payload for fast, complete `sitemap.xml` generation.
 */
export async function getAllPostsForSitemap(options?: {
  forceFresh?: boolean;
}): Promise<WPSitemapPost[]> {
  const now = Date.now();
  if (
    !options?.forceFresh &&
    sitemapMemoryCache &&
    now - sitemapMemoryCache.at < MEMORY_TTL_MS
  ) {
    return sitemapMemoryCache.items;
  }

  const collected: WPSitemapPost[] = [];
  const seenSlugs = new Set<string>();
  const maxPages = 10; // Up to 1,000 blog posts

  for (let page = 1; page <= maxPages; page++) {
    const res = await fetchWpJson(
      "/wp/v2/posts",
      {
        status: "publish",
        orderby: "modified",
        order: "desc",
        per_page: 100,
        page,
        _fields: "id,slug,date,date_gmt,modified,modified_gmt",
      },
      10_000
    );

    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      if (page === 1 && sitemapMemoryCache) {
        return sitemapMemoryCache.items;
      }
      break;
    }

    for (const raw of res.data) {
      const slug = String(raw?.slug || "").trim();
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      collected.push({
        id: Number(raw.id),
        slug,
        isoDate: toValidIsoDate(raw.date_gmt, raw.date),
        isoModified: toValidIsoDate(
          raw.modified_gmt || raw.date_gmt,
          raw.modified || raw.date
        ),
      });
    }

    const totalPagesHeader = Number(res.headers?.get("x-wp-totalpages") || "1");
    if (res.data.length < 100 || page >= totalPagesHeader) {
      break;
    }
  }

  sitemapMemoryCache = { at: now, items: collected };
  return collected;
}
