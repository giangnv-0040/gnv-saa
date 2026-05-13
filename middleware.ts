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

function isProtectedPath(pathname: string): boolean {
  // Empty for now. Add `'/admin'`, `'/profile'`, etc. when their owning specs
  // ship real (non-placeholder) pages. Homepage SAA is public.
  void pathname;
  return false;
}

export const config = {
  matcher: [
    // Run on everything EXCEPT static assets, Next internals, and the public auth surfaces.
    '/((?!_next/static|_next/image|favicon.ico|assets|login|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
