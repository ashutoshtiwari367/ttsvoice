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
          // Write cookies back to both the request and the outgoing response
          // so the client and server stay in sync.
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

  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith('/account');
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.includes('-auth-token') || c.name.startsWith('sb-')
  );

  // Skip remote auth roundtrip for API routes (they authenticate themselves)
  // and for guest visitors on public routes with no auth cookies
  if (!isProtected && !hasAuthCookie) {
    return supabaseResponse;
  }

  // Refresh the session only when needed (protected route or user with auth cookies)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Protected routes ────────────────────────────────────────────────────────
  if (isProtected && !user) {
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
     * Run on all paths except Next.js internals and static assets.
     * Adjust the matcher if you add more protected routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
