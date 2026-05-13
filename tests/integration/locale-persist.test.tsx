import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers cookies + revalidatePath (next/cache) so the Server Action
// runs in jsdom.
const cookieStore = new Map<string, { value: string; opts: Record<string, unknown> }>();
const cookieSet = vi.fn((opts: { name: string; value: string } & Record<string, unknown>) => {
  cookieStore.set(opts.name, { value: opts.value, opts });
});

vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: (...args: Parameters<typeof cookieSet>) => cookieSet(...args),
    get: (name: string) =>
      cookieStore.has(name) ? { value: cookieStore.get(name)!.value } : undefined,
  }),
}));

const revalidate = vi.fn();
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidate(...args) }));

import { setLocale } from '@/lib/i18n/actions';
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from '@/lib/i18n/config';

beforeEach(() => {
  cookieSet.mockClear();
  revalidate.mockClear();
  cookieStore.clear();
});

describe('setLocale Server Action', () => {
  it.each(['vi', 'en'])('writes a cookie for %s', async (locale) => {
    await setLocale(locale);
    expect(cookieSet).toHaveBeenCalledOnce();
    const arg = cookieSet.mock.calls[0][0];
    expect(arg.name).toBe(LOCALE_COOKIE_NAME);
    expect(arg.value).toBe(locale);
  });

  it('sets the correct cookie attributes (Max-Age, Path, SameSite, httpOnly)', async () => {
    await setLocale('en');
    const arg = cookieSet.mock.calls[0][0];
    expect(arg.maxAge).toBe(LOCALE_COOKIE_MAX_AGE);
    expect(arg.path).toBe('/');
    expect(arg.sameSite).toBe('lax');
    expect(arg.httpOnly).toBe(false);
  });

  it('revalidates the layout so the next render picks up the new locale', async () => {
    await setLocale('en');
    expect(revalidate).toHaveBeenCalledWith('/', 'layout');
  });

  it('throws on invalid or unsupported locales (defense at the trust boundary)', async () => {
    // 'ja' was removed from the supported set during Homepage SAA narrowing.
    await expect(setLocale('ja')).rejects.toThrow();
    await expect(setLocale('fr')).rejects.toThrow();
    await expect(setLocale('')).rejects.toThrow();
    await expect(setLocale(null)).rejects.toThrow();
    await expect(setLocale(42)).rejects.toThrow();
    expect(cookieSet).not.toHaveBeenCalled();
  });
});
