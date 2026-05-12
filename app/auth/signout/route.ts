import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * POST /auth/signout — clears the Supabase session cookie and redirects to /login.
 *
 * Triggered from authenticated screens (e.g. the profile dropdown). Always
 * returns a 303 to /login so the browser drops back into the unauthenticated
 * surface regardless of where the request came from.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.warn('signout: supabase signOut returned an error', { message: error.message });
    // Continue — the cookie clear is best-effort; the browser session is
    // already invalidated on our side.
  }
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
