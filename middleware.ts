import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type CookieItem = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/**
 * Next.js middleware — runs on every matched request.
 * 1. Refreshes the Supabase session cookie so it never silently expires.
 * 2. Redirects unauthenticated users away from protected routes.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
     * Only run middleware on protected routes to avoid per-request overhead on public pages & APIs.
     */
    '/account/:path*',
  ],
};
