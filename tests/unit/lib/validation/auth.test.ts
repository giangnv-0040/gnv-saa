import { describe, expect, it } from 'vitest';
import {
  oauthCallbackQuerySchema,
  localeSchema,
  oauthErrorCodeSchema,
} from '@/lib/validation/auth';

describe('oauthCallbackQuerySchema', () => {
  it('parses a happy-path callback (just code — PKCE flow, no state)', () => {
    const result = oauthCallbackQuerySchema.safeParse({ code: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('parses a callback with error param', () => {
    const result = oauthCallbackQuerySchema.safeParse({ error: 'access_denied' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.error).toBe('access_denied');
  });

  it('parses a callback with a safe redirectTo', () => {
    const result = oauthCallbackQuerySchema.safeParse({ code: 'abc', redirectTo: '/admin' });
    expect(result.success).toBe(true);
  });

  it('rejects an unsafe redirectTo', () => {
    const result = oauthCallbackQuerySchema.safeParse({
      code: 'abc',
      redirectTo: '//evil.example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown error codes', () => {
    const result = oauthCallbackQuerySchema.safeParse({ error: 'mystery_error' });
    expect(result.success).toBe(false);
  });

  it('treats missing fields as undefined (all optional)', () => {
    const result = oauthCallbackQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects empty code string', () => {
    const result = oauthCallbackQuerySchema.safeParse({ code: '' });
    expect(result.success).toBe(false);
  });
});

describe('localeSchema', () => {
  it.each(['vi', 'en'])('accepts %s', (locale) => {
    expect(localeSchema.safeParse(locale).success).toBe(true);
  });

  // Project narrowed to vi/en for Homepage SAA (FR-024). 'ja' was removed
  // from the supported set; messages/ja.json stays soft-deprecated.
  it.each(['ja', 'VI', 'jp', 'fr', 'zh', '', null, undefined, 123])('rejects %p', (value) => {
    expect(localeSchema.safeParse(value).success).toBe(false);
  });
});

describe('oauthErrorCodeSchema', () => {
  it.each([
    'access_denied',
    'domain_not_allowed',
    'invalid_state',
    'provider_error',
    'network_error',
  ])('accepts %s', (code) => {
    expect(oauthErrorCodeSchema.safeParse(code).success).toBe(true);
  });

  it('rejects unknown codes', () => {
    expect(oauthErrorCodeSchema.safeParse('something_else').success).toBe(false);
  });
});
