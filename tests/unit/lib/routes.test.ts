import { describe, expect, it } from 'vitest';
import { ROUTES, awardDeepLink } from '@/lib/routes';

describe('ROUTES', () => {
  it('exposes every key referenced by Homepage SAA', () => {
    const expectedKeys = [
      'HOME',
      'LOGIN',
      'SIGN_OUT',
      'AWARDS',
      'KUDOS',
      'KUDOS_NEW',
      'NOTIFICATIONS',
      'PROFILE',
      'ADMIN',
      'RULES',
      'COMMUNITY_STANDARDS',
    ];
    for (const key of expectedKeys) {
      expect(ROUTES).toHaveProperty(key);
    }
  });

  it('every value is an absolute path beginning with "/"', () => {
    for (const value of Object.values(ROUTES)) {
      expect(value).toMatch(/^\//);
    }
  });

  it('HOME is exactly "/"', () => {
    expect(ROUTES.HOME).toBe('/');
  });
});

describe('awardDeepLink', () => {
  it('builds /awards#{slug}', () => {
    expect(awardDeepLink('top-talent')).toBe('/awards#top-talent');
    expect(awardDeepLink('mvp')).toBe('/awards#mvp');
  });
});
