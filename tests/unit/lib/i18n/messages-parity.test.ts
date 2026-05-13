import { describe, expect, it } from 'vitest';
import vi from '@/messages/vi.json';
import en from '@/messages/en.json';

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

function collectKeyPaths(value: Json, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    collectKeyPaths(child as Json, prefix === '' ? key : `${prefix}.${key}`),
  );
}

describe('messages parity (vi/en)', () => {
  it('vi and en expose the exact same key tree', () => {
    const viKeys = new Set(collectKeyPaths(vi as Json));
    const enKeys = new Set(collectKeyPaths(en as Json));

    const missingInEn = [...viKeys].filter((k) => !enKeys.has(k));
    const missingInVi = [...enKeys].filter((k) => !viKeys.has(k));

    expect(missingInEn).toEqual([]);
    expect(missingInVi).toEqual([]);
  });

  it('all values are non-empty strings (no accidental empty translations)', () => {
    function assertNonEmpty(value: Json, path = '') {
      if (typeof value === 'string') {
        expect(value, `value at ${path} should be non-empty`).not.toBe('');
        return;
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value)) {
          assertNonEmpty(v as Json, path === '' ? k : `${path}.${k}`);
        }
      }
    }
    assertNonEmpty(vi as Json);
    assertNonEmpty(en as Json);
  });
});
