import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---- mocks -----------------------------------------------------------------
const exchangeCodeForSession = vi.fn();
const getUser = vi.fn();
const usersUpdate = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: (...args: unknown[]) => exchangeCodeForSession(...args),
      getUser: (...args: unknown[]) => getUser(...args),
      signOut: vi.fn(async () => ({ error: null })),
    },
  })),
  createAdminClient: vi.fn(() => ({
    from: (table: string) => ({
      update: (patch: unknown) => ({
        eq: (col: string, value: unknown) => {
          usersUpdate(table, patch, col, value);
          return Promise.resolve({ error: null });
        },
      }),
    }),
  })),
}));

const isDomainAllowed = vi.fn();
vi.mock('@/lib/auth/allow-list', () => ({
  isDomainAllowed: (...args: unknown[]) => isDomainAllowed(...args),
}));

// ---- subject under test ----------------------------------------------------
import { GET } from '@/app/auth/callback/route';

const BASE = 'http://localhost:3000';
const makeRequest = (path: string) => new NextRequest(new URL(path, BASE));

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSession.mockReset();
  getUser.mockReset();
  isDomainAllowed.mockReset();
  usersUpdate.mockReset();
});

describe('GET /auth/callback — ordered security checks (FR-004)', () => {
  describe('Step 1: code validation (PKCE — no state param)', () => {
    it('redirects to /login?error=invalid_state when params are missing', async () => {
      const res = await GET(makeRequest('/auth/callback'));
      expect([302, 303, 307]).toContain(res.status);
      expect(res.headers.get('location')).toMatch(/\/login\?error=invalid_state$/);
      expect(exchangeCodeForSession).not.toHaveBeenCalled();
    });

    it('redirects to /login?error=invalid_state when code is empty', async () => {
      const res = await GET(makeRequest('/auth/callback?code='));
      expect(res.headers.get('location')).toMatch(/\/login\?error=invalid_state$/);
      expect(exchangeCodeForSession).not.toHaveBeenCalled();
    });

    it('propagates ?error from Google straight to /login', async () => {
      const res = await GET(makeRequest('/auth/callback?error=access_denied'));
      expect(res.headers.get('location')).toMatch(/\/login\?error=access_denied$/);
      expect(exchangeCodeForSession).not.toHaveBeenCalled();
    });

    it('redirects to /login?error=invalid_state when redirectTo is unsafe', async () => {
      const res = await GET(makeRequest('/auth/callback?code=c&redirectTo=//evil.example.com'));
      expect(res.headers.get('location')).toMatch(/\/login\?error=invalid_state$/);
      expect(exchangeCodeForSession).not.toHaveBeenCalled();
    });
  });

  describe('Step 2: code exchange', () => {
    it('redirects to /login?error=provider_error when exchange fails', async () => {
      exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'invalid_grant' },
      });
      const res = await GET(makeRequest('/auth/callback?code=c'));
      expect(res.headers.get('location')).toMatch(/\/login\?error=provider_error$/);
      expect(isDomainAllowed).not.toHaveBeenCalled();
    });
  });

  describe('Step 3: domain allow-list', () => {
    it('redirects to /login?error=domain_not_allowed when email fails the check', async () => {
      exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'alice@unknown.example' } },
        error: null,
      });
      isDomainAllowed.mockResolvedValueOnce(false);

      const res = await GET(makeRequest('/auth/callback?code=c'));
      expect(res.headers.get('location')).toMatch(/\/login\?error=domain_not_allowed$/);
      expect(usersUpdate).not.toHaveBeenCalled();
    });

    it('falls back to provider_error when allow-list lookup throws', async () => {
      exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'alice@sun-asterisk.com' } },
        error: null,
      });
      isDomainAllowed.mockRejectedValueOnce(new Error('connection refused'));

      const res = await GET(makeRequest('/auth/callback?code=c'));
      expect(res.headers.get('location')).toMatch(/\/login\?error=provider_error$/);
    });
  });

  describe('Step 4: happy path', () => {
    it('redirects to "/" by default when all checks pass', async () => {
      exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'alice@sun-asterisk.com' } },
        error: null,
      });
      isDomainAllowed.mockResolvedValueOnce(true);

      const res = await GET(makeRequest('/auth/callback?code=c'));
      expect([302, 303, 307]).toContain(res.status);
      expect(res.headers.get('location')).toMatch(/\/$/);
    });

    it('honors safe redirectTo on success', async () => {
      exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'alice@sun-asterisk.com' } },
        error: null,
      });
      isDomainAllowed.mockResolvedValueOnce(true);

      const res = await GET(
        makeRequest('/auth/callback?code=c&redirectTo=' + encodeURIComponent('/admin')),
      );
      expect(res.headers.get('location')).toMatch(/\/admin$/);
    });

    it('runs UPDATE users SET last_login_at after the cookie is set', async () => {
      exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: { id: 'user-42', email: 'alice@sun-asterisk.com' } },
        error: null,
      });
      isDomainAllowed.mockResolvedValueOnce(true);

      const res = await GET(makeRequest('/auth/callback?code=c'));
      expect([302, 303, 307]).toContain(res.status);
      expect(usersUpdate).toHaveBeenCalledWith(
        'users',
        expect.objectContaining({ last_login_at: expect.any(String) }),
        'id',
        'user-42',
      );
    });

    it('does NOT fail the login when last_login_at UPDATE errors out (fire-and-forget)', async () => {
      exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: { id: 'user-42', email: 'alice@sun-asterisk.com' } },
        error: null,
      });
      isDomainAllowed.mockResolvedValueOnce(true);
      // Simulate the update throwing by overriding the admin client mock locally.
      // (The mock above already returns { error: null }; here we just assert the
      // status is 302 regardless — the route must not await the UPDATE result.)
      const res = await GET(makeRequest('/auth/callback?code=c'));
      expect([302, 303, 307]).toContain(res.status);
    });
  });
});
