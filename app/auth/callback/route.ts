import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles the OAuth / magic-link callback from Supabase.
 * Supabase redirects here with a `code` query param which we exchange
 * for a session, then send the user to their intended destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/text-to-speech';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data?.user?.id) {
        const { ensureCustomer } = await import('@/lib/credits');
        await ensureCustomer(data.user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send back to login with error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
