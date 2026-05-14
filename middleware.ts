import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Refreshes the Supabase session cookie on every request. For protected
 * matchers it redirects unauthenticated users to /login?redirectTo=<path>.
 *
 * Homepage SAA (`/`) is intentionally NOT protected — anonymous visitors are
 * welcome on the public landing page (spec FR-019). Admin paths and other
 * authenticated routes will be added to `isProtectedPath` when those
 * features land.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('redirectTo', pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

const PROTECTED_PATHS: readonly string[] = ['/awards'];

function isProtectedPath(pathname: string): boolean {
  // Homepage SAA (`/`) is public. Awards Information (`/awards`) is protected
  // per Hệ thống giải spec Test ID-1. Anonymous visitors arriving here are
  // redirected to /login?redirectTo=<original-path-with-hash>.
  //
  // Add `'/admin'`, `'/profile'`, `/notifications`, etc. when their owning
  // specs ship real (non-placeholder) authenticated pages.
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const config = {
  matcher: [
    // Run on everything EXCEPT static assets, Next internals, and the public auth surfaces.
    '/((?!_next/static|_next/image|favicon.ico|assets|login|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
