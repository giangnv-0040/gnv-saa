import { describe, expect, it, vi, beforeEach } from 'vitest';
import { isDomainAllowed } from '@/lib/auth/allow-list';

const fromMock = vi.fn();
const selectMock = vi.fn();
const eqMock = vi.fn();
const limitMock = vi.fn();
const maybeSingleMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({ from: fromMock }),
  createServerClient: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Chain: from(...).select(...).eq(...).limit(...).maybeSingle()
  fromMock.mockReturnValue({ select: selectMock });
  selectMock.mockReturnValue({ eq: eqMock });
  eqMock.mockReturnValue({ limit: limitMock });
  limitMock.mockReturnValue({ maybeSingle: maybeSingleMock });
});

describe('isDomainAllowed', () => {
  it('returns true when the email domain is enabled in the allow-list', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: { domain: 'sun-asterisk.com' },
      error: null,
    });
    await expect(isDomainAllowed('alice@sun-asterisk.com')).resolves.toBe(true);
    expect(fromMock).toHaveBeenCalledWith('auth_allowed_domains');
    expect(eqMock).toHaveBeenCalledWith('domain', 'sun-asterisk.com');
  });

  it('matches case-insensitively (User@Sun-Asterisk.com → sun-asterisk.com)', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: { domain: 'sun-asterisk.com' },
      error: null,
    });
    await expect(isDomainAllowed('User@Sun-Asterisk.com')).resolves.toBe(true);
    expect(eqMock).toHaveBeenCalledWith('domain', 'sun-asterisk.com');
  });

  it('returns false when the domain is not in the allow-list', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(isDomainAllowed('user@unknown.example')).resolves.toBe(false);
  });

  it('returns false when the row exists but is disabled (filtered server-side)', async () => {
    // The query filters enabled=true, so a disabled row returns null.
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(isDomainAllowed('user@disabled-partner.example')).resolves.toBe(false);
  });

  it('returns false on a malformed email (no @)', async () => {
    await expect(isDomainAllowed('not-an-email')).resolves.toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('returns false on an empty string', async () => {
    await expect(isDomainAllowed('')).resolves.toBe(false);
  });

  it('throws if the underlying query returns an error', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'connection refused' },
    });
    await expect(isDomainAllowed('alice@sun-asterisk.com')).rejects.toThrow();
  });
});
