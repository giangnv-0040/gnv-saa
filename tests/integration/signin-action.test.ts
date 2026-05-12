import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- mocks -----------------------------------------------------------------
const signInWithOAuth = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args) },
  })),
}));

class RedirectError extends Error {
  digest = 'NEXT_REDIRECT;303;/somewhere';
  constructor(public url: string) {
    super(`NEXT_REDIRECT ${url}`);
  }
}

const redirect = vi.fn((url: string) => {
  throw new RedirectError(url);
});

vi.mock('next/navigation', () => ({ redirect: (url: string) => redirect(url) }));

import { signInWithGoogle } from '@/app/login/actions';

const fd = (entries: Record<string, string>) => {
  const form = new FormData();
  for (const [k, v] of Object.entries(entries)) form.set(k, v);
  return form;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signInWithGoogle Server Action — US4 error handling', () => {
  it('redirects to Google when Supabase returns an OAuth URL', async () => {
    signInWithOAuth.mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?abc=123' },
      error: null,
    });
    await expect(signInWithGoogle(fd({ redirectTo: '/' }))).rejects.toMatchObject({
      url: 'https://accounts.google.com/o/oauth2/v2/auth?abc=123',
    });
  });

  it('sanitizes redirectTo before embedding into the callback URL', async () => {
    signInWithOAuth.mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
      error: null,
    });
    await expect(signInWithGoogle(fd({ redirectTo: '//evil.example.com' }))).rejects.toBeDefined();

    const callOpts = signInWithOAuth.mock.calls[0][0];
    expect(callOpts.options.redirectTo).toMatch(/redirectTo=%2F$/); // sanitized to "/"
  });

  it('redirects to /login?error=provider_error when Supabase returns no URL', async () => {
    signInWithOAuth.mockResolvedValueOnce({
      data: { url: null },
      error: { message: 'OAuth provider unreachable' },
    });
    await expect(signInWithGoogle(fd({ redirectTo: '/' }))).rejects.toMatchObject({
      url: '/login?error=provider_error',
    });
  });

  it('redirects to /login?error=network_error when the call throws unexpectedly', async () => {
    signInWithOAuth.mockRejectedValueOnce(new Error('socket hang up'));
    await expect(signInWithGoogle(fd({ redirectTo: '/' }))).rejects.toMatchObject({
      url: '/login?error=network_error',
    });
  });

  it('forwards NEXT_REDIRECT errors verbatim (does not wrap them as network_error)', async () => {
    // Simulate `redirect()` throwing the internal NEXT_REDIRECT (success path).
    signInWithOAuth.mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/foo' },
      error: null,
    });
    try {
      await signInWithGoogle(fd({ redirectTo: '/' }));
    } catch (err) {
      expect((err as RedirectError).url).toBe('https://accounts.google.com/foo');
      expect((err as RedirectError).digest).toMatch(/^NEXT_REDIRECT/);
    }
  });
});
