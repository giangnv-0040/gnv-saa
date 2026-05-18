/**
 * Integration tests for the prelaunch branch in `middleware.ts`.
 *
 * Covers:
 * - US3 path sweep (in-scope paths rewrite to /prelaunch during prelaunch,
 *   pass through when env unset).
 * - US3 API matrix (/api/* returns 503 except /api/auth/* and /api/healthz).
 * - TR-003 cookie preservation through rewrite + 503 responses.
 * - FR-005 / decision #4 — /auth/callback and /auth/signout pass through.
 * - FR-004 — Next.js internals and image assets pass through.
 * - Regression guard — with env unset, every path behaves like today.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock updateSession BEFORE importing middleware so the import graph never
// touches the real Supabase client. The mock attaches a stable test cookie
// onto the response so we can assert preservation later (TR-003).
vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(async (request: NextRequest) => {
    const response = NextResponse.next({ request });
    response.cookies.set('sb-test-token', 'updateSession-cookie-value', {
      path: '/',
      httpOnly: true,
    });
    return { response, user: null };
  }),
}));

let middleware: typeof import('@/middleware').middleware;

beforeEach(async () => {
  vi.resetModules();
  ({ middleware } = await import('@/middleware'));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'https://saa.test'));
}

describe('middleware — prelaunch active (env in the future)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2030-01-01T00:00:00Z');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  it.each([
    '/',
    '/login',
    '/awards',
    '/kudos/abc',
    '/profile',
    '/admin',
    '/random/unknown/path',
    '/notifications',
  ])('rewrites %s to /prelaunch (US1 + US3)', async (path) => {
    const req = makeRequest(path);
    const res = await middleware(req);
    expect(res.headers.get('x-middleware-rewrite')).toContain('/prelaunch');
  });

  it.each(['/auth/callback?code=abc', '/auth/callback', '/auth/signout', '/prelaunch'])(
    'does NOT rewrite %s (FR-005 + decision #4)',
    async (path) => {
      const req = makeRequest(path);
      const res = await middleware(req);
      expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    },
  );

  it('does NOT rewrite Next.js internals and image assets (FR-004)', async () => {
    for (const path of [
      '/_next/static/chunks/main.js',
      '/_next/image?url=foo&w=1&q=75',
      '/favicon.ico',
      '/assets/prelaunch/hero-bg.png',
      '/some-image.svg',
    ]) {
      const req = makeRequest(path);
      const res = await middleware(req);
      expect(
        res.headers.get('x-middleware-rewrite'),
        `expected ${path} to pass through`,
      ).toBeNull();
    }
  });

  it.each(['/api/auth/whatever', '/api/auth/callback', '/api/healthz'])(
    'allows API exception path %s to pass through (FR-006)',
    async (path) => {
      const req = makeRequest(path);
      const res = await middleware(req);
      expect(res.status).not.toBe(503);
      expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    },
  );

  it.each(['/api/foo', '/api/awards', '/api/admin/users'])(
    'returns HTTP 503 with { error: "prelaunch" } for non-exempt API path %s (FR-006)',
    async (path) => {
      const req = makeRequest(path);
      const res = await middleware(req);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body).toEqual({ error: 'prelaunch' });
    },
  );

  it('preserves session cookies on rewrite responses (TR-003)', async () => {
    const req = makeRequest('/awards');
    const res = await middleware(req);
    expect(res.headers.get('x-middleware-rewrite')).toContain('/prelaunch');
    expect(res.cookies.get('sb-test-token')?.value).toBe('updateSession-cookie-value');
  });

  it('preserves session cookies on 503 API responses (TR-003)', async () => {
    const req = makeRequest('/api/foo');
    const res = await middleware(req);
    expect(res.status).toBe(503);
    expect(res.cookies.get('sb-test-token')?.value).toBe('updateSession-cookie-value');
  });
});

describe('middleware — prelaunch inactive (env unset)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  it.each(['/', '/login', '/awards', '/kudos/abc', '/admin', '/api/foo'])(
    "does NOT rewrite %s (regression guard — today's behavior)",
    async (path) => {
      const req = makeRequest(path);
      const res = await middleware(req);
      // Note: /awards is still protected for unauthenticated users (redirect
      // to /login). The prelaunch check must NOT introduce a rewrite when
      // env is unset.
      expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    },
  );

  it('redirects unauthenticated /awards to /login (existing behavior preserved)', async () => {
    const req = makeRequest('/awards');
    const res = await middleware(req);
    expect(res.status).toBe(307); // Next.js default redirect status
    expect(res.headers.get('location')).toContain('/login');
  });
});

describe('middleware — prelaunch with past date', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2020-01-01T00:00:00Z');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  it('does NOT rewrite when env is in the past (FR-009 fail-open)', async () => {
    const req = makeRequest('/awards');
    const res = await middleware(req);
    // No prelaunch rewrite — should hit the protected-path branch instead.
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
  });
});
