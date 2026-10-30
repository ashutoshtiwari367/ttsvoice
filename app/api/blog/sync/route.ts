import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  clearWordPressCache,
  getAllPostsForSitemap,
  getWordPressBaseUrl,
  syncBlogEntriesToSupabase,
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

  // 2. Pull fresh posts directly from WordPress CMS & save to Supabase `tt_blog_metadata`
  const posts = await getAllPostsForSitemap({ forceFresh: true });
  const dbSync = await syncBlogEntriesToSupabase(posts);

  // 3. Revalidate Next.js App Router blog & sitemap paths
  try {
    revalidatePath("/blog");
    revalidatePath("/blog/[slug]", "page");
    revalidatePath("/sitemap.xml");
    revalidatePath("/sitemap/[__metadata_id__]", "page");
  } catch {
    // ignore if called outside static cache context
  }

  return NextResponse.json(
    {
      synced: true,
      cmsUrl: getWordPressBaseUrl(),
      syncedAt: new Date().toISOString(),
      postCount: posts.length,
      supabaseUpserted: dbSync.upserted,
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

