import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { awards, AWARD_BACKGROUND_IMAGE } from '@/lib/awards/config';
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

const repoRoot = path.resolve(__dirname, '../../../..');

describe('awards catalogue', () => {
  it('has exactly 6 entries (FR-011)', () => {
    expect(awards).toHaveLength(6);
  });

  it('slugs are unique and kebab-case', () => {
    const slugs = awards.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('lists awards in the order from Figma C2.1 … C2.6', () => {
    expect(awards.map((a) => a.slug)).toEqual([
      'top-talent',
      'top-project',
      'top-project-leader',
      'best-manager',
      'signature-2025-creator',
      'mvp',
    ]);
  });

  it('every titleKey + descriptionKey resolves in vi and en messages', () => {
    for (const award of awards) {
      expect(getByPath(vi as Json, award.titleKey), `vi: ${award.titleKey}`).toBeTruthy();
      expect(getByPath(en as Json, award.titleKey), `en: ${award.titleKey}`).toBeTruthy();
      expect(
        getByPath(vi as Json, award.descriptionKey),
        `vi: ${award.descriptionKey}`,
      ).toBeTruthy();
      expect(
        getByPath(en as Json, award.descriptionKey),
        `en: ${award.descriptionKey}`,
      ).toBeTruthy();
    }
  });

  it('every name image file exists on disk', () => {
    for (const award of awards) {
      const abs = path.join(repoRoot, 'public', award.nameImage.replace(/^\//, ''));
      expect(existsSync(abs), `missing asset: ${abs}`).toBe(true);
    }
  });

  it('shared award background image exists on disk', () => {
    const abs = path.join(repoRoot, 'public', AWARD_BACKGROUND_IMAGE.replace(/^\//, ''));
    expect(existsSync(abs)).toBe(true);
  });
});
