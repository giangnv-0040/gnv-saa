import { describe, expect, it } from 'vitest';
import { awards } from '@/lib/awards/config';
import { awardDetails } from '@/lib/awards/details';
import vi from '@/messages/vi.json';
import en from '@/messages/en.json';

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

function getByPath(obj: Json, dotted: string): Json | undefined {
  return dotted.split('.').reduce<Json | undefined>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, Json>)[key];
    }
    return undefined;
  }, obj);
}

describe('awardDetails catalogue', () => {
  it('has an entry for every slug in awards.config.ts (slug parity)', () => {
    const detailSlugs = Object.keys(awardDetails);
    const awardSlugs = awards.map((a) => a.slug);
    expect(new Set(detailSlugs)).toEqual(new Set(awardSlugs));
  });

  it('every detail entry self-references its own slug', () => {
    for (const [key, detail] of Object.entries(awardDetails)) {
      expect(detail.slug).toBe(key);
    }
  });

  it('every longDescriptionKey resolves in vi AND en messages', () => {
    for (const detail of Object.values(awardDetails)) {
      expect(
        getByPath(vi as Json, detail.longDescriptionKey),
        `vi missing ${detail.longDescriptionKey}`,
      ).toBeTruthy();
      expect(
        getByPath(en as Json, detail.longDescriptionKey),
        `en missing ${detail.longDescriptionKey}`,
      ).toBeTruthy();
    }
  });

  it('quantity is a 2-digit zero-padded string', () => {
    for (const detail of Object.values(awardDetails)) {
      expect(detail.quantity, `slug=${detail.slug}`).toMatch(/^[0-9]{2}$/);
    }
  });

  it('unit is Vietnamese or empty (per resolved decision)', () => {
    const allowed = new Set(['Đơn vị', 'Tập thể', 'Cá nhân', '']);
    for (const detail of Object.values(awardDetails)) {
      expect(allowed.has(detail.unit), `slug=${detail.slug} unit=${detail.unit}`).toBe(true);
    }
  });

  it('value contains "VNĐ" (raw currency string, not formatted)', () => {
    for (const detail of Object.values(awardDetails)) {
      expect(detail.value).toMatch(/VNĐ/);
    }
  });

  it('catalogue matches the 6 known award slugs in order', () => {
    expect(Object.keys(awardDetails)).toEqual([
      'top-talent',
      'top-project',
      'top-project-leader',
      'best-manager',
      'signature-2025-creator',
      'mvp',
    ]);
  });
});
