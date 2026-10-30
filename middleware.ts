import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { seoConfig } from '@/seo.config';
import { sitemapChunkIds } from '@/lib/seo/sitemap';

type CookieItem = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/**
 * Next.js middleware — runs on every matched request.
 * 1. Serves the parent `<sitemapindex>` at `/sitemap.xml` pointing to `/sitemap/0.xml`, `/sitemap/1.xml`, etc.
 * 2. Refreshes the Supabase session cookie so it never silently expires.
 * 3. Redirects unauthenticated users away from protected routes.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/sitemap.xml') {
    const ids = await sitemapChunkIds(seoConfig);
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...ids.map(
        ({ id }) =>
          `  <sitemap>\n    <loc>${seoConfig.siteUrl}/sitemap/${id}.xml</loc>\n  </sitemap>`,
      ),
      '</sitemapindex>',
      '',
    ].join('\n');

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  }

  const isProtected = pathname.startsWith('/account');

  // Public pages, studio, marketing, and API routes pass through immediately with zero overhead
  if (!isProtected) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieItem[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Verify session for protected route
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Protected routes ────────────────────────────────────────────────────────
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Only run middleware on protected routes & /sitemap.xml index to avoid per-request overhead on public pages & APIs.
     */
    '/account/:path*',
    '/sitemap.xml',
  ],
};
