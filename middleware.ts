import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { assertEventStartConfig, isPrelaunch } from '@/lib/event/config';
import { preserveCookies } from '@/lib/middleware/preserve-cookies';

/**
 * Root middleware.
 *
 * Order of operations:
 *   1. Refresh the Supabase session cookie via `updateSession` (always; even
 *      during prelaunch — TR-003 requires session continuity across the gate).
 *   2. **Prelaunch gate** (FR-001 / FR-003 / FR-006): while
 *      `NEXT_PUBLIC_EVENT_START_AT` is in the future, every in-scope request
 *      is rewritten to `/prelaunch`. APIs short-circuit with HTTP 503
 *      except `/api/auth/*` and `/api/healthz`. `/auth/callback` and
 *      `/auth/signout` pass through so OAuth flows + symmetric signout work.
 *   3. Existing protected-path redirect (e.g. `/awards` → `/login` when
 *      unauthenticated). Only reached when prelaunch is inactive.
 */
export async function middleware(request: NextRequest) {
  // Lazy, idempotent misconfiguration warning (plan decision #7).
  assertEventStartConfig();

  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (isPrelaunch()) {
    if (isApiAllowed(pathname)) return response; // /api/auth/*, /api/healthz
    if (pathname.startsWith('/api/')) {
      return preserveCookies(response, NextResponse.json({ error: 'prelaunch' }, { status: 503 }));
    }
    if (!isPrelaunchSkipped(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/prelaunch';
      url.search = '';
      return preserveCookies(response, NextResponse.rewrite(url));
    }
  }

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('redirectTo', pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

const PROTECTED_PATHS: readonly string[] = ['/awards', '/kudos/new'];

function isProtectedPath(pathname: string): boolean {
  // Homepage SAA (`/`) is public. Awards Information (`/awards`) is protected
  // per Hệ thống giải spec Test ID-1. Anonymous visitors arriving here are
  // redirected to /login?redirectTo=<original-path-with-hash>.
  //
  // Add `'/admin'`, `'/profile'`, `/notifications`, etc. when their owning
  // specs ship real (non-placeholder) authenticated pages.
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** API paths that MUST keep working during prelaunch (FR-006 exceptions). */
function isApiAllowed(pathname: string): boolean {
  return pathname.startsWith('/api/auth/') || pathname === '/api/healthz';
}

/**
 * Non-API paths that pass through during prelaunch — Next.js internals,
 * the prelaunch page itself, the OAuth callback (FR-005), the symmetric
 * signout handler (decision #4), and image-extension assets (FR-004).
 *
 * Note: most of these are already excluded by `config.matcher` and never
 * reach this function. This list is the in-function defense-in-depth so a
 * future matcher relaxation does not accidentally rewrite a session-critical
 * route.
 */
function isPrelaunchSkipped(pathname: string): boolean {
  return (
    pathname === '/prelaunch' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/auth/signout') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  );
}

export const config = {
  matcher: [
    // Run on everything EXCEPT static assets and a small set of Next.js
    // internals. `/login` is intentionally NOT excluded — during prelaunch
    // it must rewrite too (decision #3, FR-002). `/auth/callback` is
    // excluded so the OAuth exchange never sees our middleware (FR-005).
    '/((?!_next/static|_next/image|favicon.ico|assets|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
