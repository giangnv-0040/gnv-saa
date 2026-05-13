import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type AuthResult = {
  data: { user: { id: string } | null };
  error: { message: string } | null;
};
type DbResult = {
  data: Record<string, unknown> | null;
  error: { message: string } | null;
};

const authGetUser = vi.fn<() => Promise<AuthResult>>();
const dbMaybeSingle = vi.fn<() => Promise<DbResult>>();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: authGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: dbMaybeSingle,
        }),
      }),
    }),
  })),
}));

// Silence logger.warn in tests so the output stays clean.
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

import { getCurrentUserProfile } from '@/lib/users/actions';

beforeEach(() => {
  authGetUser.mockReset();
  dbMaybeSingle.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('getCurrentUserProfile', () => {
  it('returns null when there is no session (anonymous)', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(getCurrentUserProfile()).resolves.toBeNull();
    expect(dbMaybeSingle).not.toHaveBeenCalled();
  });

  it('returns null when supabase.auth.getUser reports an error', async () => {
    authGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'invalid jwt' },
    });
    await expect(getCurrentUserProfile()).resolves.toBeNull();
  });

  it('returns null (does NOT throw) when the users row lookup fails', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-1' } }, error: null });
    dbMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'rls-denied' } });
    await expect(getCurrentUserProfile()).resolves.toBeNull();
  });

  it('returns a typed profile when the lookup succeeds (regular user)', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-1' } }, error: null });
    dbMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'u-1',
        email: 'alice@sun-asterisk.com',
        display_name: 'Alice',
        avatar_url: 'https://cdn/avatar.png',
        locale: 'vi',
        role: 'user',
      },
      error: null,
    });
    const profile = await getCurrentUserProfile();
    expect(profile).toEqual({
      id: 'u-1',
      email: 'alice@sun-asterisk.com',
      displayName: 'Alice',
      avatarUrl: 'https://cdn/avatar.png',
      locale: 'vi',
      role: 'user',
    });
  });

  it('reflects admin role from the database', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-2' } }, error: null });
    dbMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'u-2',
        email: 'admin@sun-asterisk.com',
        display_name: null,
        avatar_url: null,
        locale: 'en',
        role: 'admin',
      },
      error: null,
    });
    const profile = await getCurrentUserProfile();
    expect(profile?.role).toBe('admin');
    expect(profile?.locale).toBe('en');
    expect(profile?.displayName).toBeNull();
  });

  it('coerces stale `ja` locale rows to the default `vi`', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-3' } }, error: null });
    dbMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'u-3',
        email: 'legacy@sun-asterisk.com',
        display_name: 'Legacy',
        avatar_url: null,
        locale: 'ja',
        role: 'user',
      },
      error: null,
    });
    const profile = await getCurrentUserProfile();
    expect(profile?.locale).toBe('vi');
  });
});
