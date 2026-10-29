import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  clearWordPressCache,
  getAllPostsForSitemap,
  getWordPressBaseUrl,
} from "@/lib/wordpress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleSync(req: NextRequest) {
  const secret = process.env.BLOG_SYNC_SECRET;
  if (secret) {
    const provided =
      req.nextUrl.searchParams.get("secret") ||
      req.headers.get("x-blog-sync-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 1. Purge in-memory WordPress cache
  clearWordPressCache();

  // 2. Revalidate Next.js App Router blog & sitemap paths
  try {
    revalidatePath("/blog");
    revalidatePath("/blog/[slug]", "page");
    revalidatePath("/sitemap.xml");
  } catch {
    // ignore if called outside static cache context
  }

  // 3. Pull fresh posts directly from WordPress CMS
  const posts = await getAllPostsForSitemap({ forceFresh: true });

  return NextResponse.json(
    {
      synced: true,
      cmsUrl: getWordPressBaseUrl(),
      syncedAt: new Date().toISOString(),
      postCount: posts.length,
      latestPosts: posts.slice(0, 10).map((p) => ({
        id: p.id,
        slug: p.slug,
        url: `/blog/${p.slug}`,
        lastModified: p.isoModified,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

