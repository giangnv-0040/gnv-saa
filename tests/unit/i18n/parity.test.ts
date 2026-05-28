import { describe, expect, it } from 'vitest';
import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';
import jaMessages from '@/messages/ja.json';

/**
 * Mirrors `scripts/check-i18n-parity.mjs` as a Vitest test so the standard
 * `npm test` run blocks on i18n drift. The script remains the canonical CI
 * gate (faster + can run without the full Vitest setup), this test simply
 * wires it into the developer-facing watch loop.
 */
function flatten(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flatten(value, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

describe('i18n key parity', () => {
  const vi = new Set(flatten(viMessages));
  const en = new Set(flatten(enMessages));
  const ja = new Set(flatten(jaMessages));

  it('VI and EN expose the same key set', () => {
    const missingInEn = [...vi].filter((k) => !en.has(k));
    const extraInEn = [...en].filter((k) => !vi.has(k));
    expect(missingInEn, `EN missing: ${missingInEn.join(', ')}`).toEqual([]);
    expect(extraInEn, `EN extra: ${extraInEn.join(', ')}`).toEqual([]);
  });

  it('VI and JA expose the same key set', () => {
    const missingInJa = [...vi].filter((k) => !ja.has(k));
    const extraInJa = [...ja].filter((k) => !vi.has(k));
    expect(missingInJa, `JA missing: ${missingInJa.join(', ')}`).toEqual([]);
    expect(extraInJa, `JA extra: ${extraInJa.join(', ')}`).toEqual([]);
  });
});
