const WP_URL = (
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://olistoolblogs.tech"
).replace(/\/+$/, "");

export interface WPPost {
  id: number;
  slug: string;
  date: string;
  isoDate: string;
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

export interface TOCItem {
  id: string;
  text: string;
  level: number;
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
      const cleanText = innerHtml.replace(/<[^>]*>/g, "").trim();
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

  // If the article has NO <h1-h6> tags, extract logical anchor points from paragraphs so TOC is always visible!
  if (!hasHeadings) {
    const pRegex = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
    const pMatches = Array.from(contentHtml.matchAll(pRegex));

    if (pMatches.length > 0) {
      // Pick 4-6 evenly spaced paragraphs
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
            const rawText = innerHtml.replace(/<[^>]*>/g, "").trim();
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
  const words = content.replace(/<[^>]*>/g, "").trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export async function getPosts(limit: number = 12): Promise<WPPost[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/posts?_embed&per_page=${limit}`,
      {
        signal: controller.signal,
        next: { revalidate: 120 },
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; IndianTTS/1.0)",
        },
      }
    ).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      console.warn(`[WordPress] Failed to fetch posts: status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((post: any) => ({
      id: post.id,
      slug: post.slug,
      date: new Date(post.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      isoDate: post.date,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage:
        post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.large?.source_url ||
        null,
      authorName: post._embedded?.author?.[0]?.name || "Editor",
      authorAvatar:
        post._embedded?.author?.[0]?.avatar_urls?.["96"] ||
        post._embedded?.author?.[0]?.avatar_urls?.["48"] ||
        null,
      authorBio: post._embedded?.author?.[0]?.description || "",
      category:
        post._embedded?.["wp:term"]?.[0]?.[0]?.name || "Articles",
      categorySlug:
        post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "articles",
      readingTime: calculateReadingTime(post.content?.rendered || ""),
    }));
  } catch (error: any) {
    console.error("[WordPress] Network error fetching posts:", error?.message);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(cleanSlug)}&_embed`,
      {
        signal: controller.signal,
        next: { revalidate: 120 },
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; IndianTTS/1.0)",
        },
      }
    ).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      console.warn(`[WordPress] Failed to fetch post [${cleanSlug}]: status ${res.status}`);
      return null;
    }

    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      // Fallback: If slug query returned empty, try searching recent posts
      const recent = await getPosts(20);
      const matched = recent.find((p) => p.slug.toLowerCase() === cleanSlug);
      return matched || null;
    }

    const post = posts[0];
    return {
      id: post.id,
      slug: post.slug,
      date: new Date(post.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      isoDate: post.date,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage:
        post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.large?.source_url ||
        null,
      authorName: post._embedded?.author?.[0]?.name || "Editor",
      authorAvatar:
        post._embedded?.author?.[0]?.avatar_urls?.["96"] ||
        post._embedded?.author?.[0]?.avatar_urls?.["48"] ||
        null,
      authorBio: post._embedded?.author?.[0]?.description || "",
      category:
        post._embedded?.["wp:term"]?.[0]?.[0]?.name || "Articles",
      categorySlug:
        post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "articles",
      readingTime: calculateReadingTime(post.content?.rendered || ""),
    };
  } catch (error: any) {
    console.error(`[WordPress] Network error fetching post [${cleanSlug}]:`, error?.message);
    // Secondary fallback attempt: check recent posts in case of direct slug query timeout
    try {
      const recent = await getPosts(15);
      const matched = recent.find((p) => p.slug.toLowerCase() === cleanSlug);
      if (matched) return matched;
    } catch {
      // ignore secondary failure
    }
    return null;
  }
}
