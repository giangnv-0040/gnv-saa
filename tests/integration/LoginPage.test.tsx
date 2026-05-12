import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- mocks -----------------------------------------------------------------
const getUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: () => getUser() },
  })),
}));

const redirect = vi.fn((url: string) => {
  // Mirror next/navigation's throw-on-redirect behavior so the calling
  // Server Component never sees code after redirect().
  throw new RedirectError(url);
});

class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT ${url}`);
  }
}

vi.mock('next/navigation', () => ({ redirect: (url: string) => redirect(url) }));

// next-intl/server's getLocale needs Server Component context (NextRequest scope).
// In jsdom we mock it to return the default locale.
vi.mock('next-intl/server', () => ({
  getLocale: async () => 'vi',
}));

// ---- subject under test ----------------------------------------------------
import LoginPage from '@/app/login/page';

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockReset();
});

describe('LoginPage Server Component (US1, US3)', () => {
  it('redirects to "/" when an authenticated session is present (no flash)', async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'alice@sun-asterisk.com' } },
      error: null,
    });

    await expect(LoginPage({ searchParams: Promise.resolve({}) })).rejects.toMatchObject({
      url: '/',
    });
  });

  it('honors safe redirectTo when authenticated', async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'alice@sun-asterisk.com' } },
      error: null,
    });

    await expect(
      LoginPage({ searchParams: Promise.resolve({ redirectTo: '/admin' }) }),
    ).rejects.toMatchObject({ url: '/admin' });
  });

  it('sanitizes unsafe redirectTo when authenticated (falls back to "/")', async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'alice@sun-asterisk.com' } },
      error: null,
    });

    await expect(
      LoginPage({ searchParams: Promise.resolve({ redirectTo: '//evil.example.com' }) }),
    ).rejects.toMatchObject({ url: '/' });
  });

  it('renders the Login UI when no session is present', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const result = await LoginPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeDefined();
    // No redirect should have been thrown.
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders the Login UI when the cookie is expired (Supabase returns null user)', async () => {
    // Supabase auth.getUser() returns { user: null } for expired/refresh-failed sessions.
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const result = await LoginPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeDefined();
    expect(redirect).not.toHaveBeenCalled();
  });
});
