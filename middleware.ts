import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Refreshes the Supabase session cookie on every request. For protected
 * matchers it redirects unauthenticated users to /login?redirectTo=<path>.
 *
 * For MVP the only protected matcher is `/`. Admin paths will be added when
 * those features land.
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

function isProtectedPath(pathname: string): boolean {
  // Initial set: only the homepage. Extend when admin/feature pages land.
  return pathname === '/';
}

export const config = {
  matcher: [
    // Run on everything EXCEPT static assets, Next internals, and the public auth surfaces.
    '/((?!_next/static|_next/image|favicon.ico|assets|login|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
