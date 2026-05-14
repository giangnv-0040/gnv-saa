import type { AwardDetail } from './types';

/**
 * Per-award detail metadata for the Hệ thống giải (`/awards`) page. Keyed by
 * slug — MUST stay in sync with `lib/awards/config.ts` (single source of
 * truth for award slugs).
 *
 * Quantity / unit / value strings are raw Vietnamese per resolved spec
 * decision (kept untranslated across both `vi` and `en` locales). Long
 * descriptions ARE localised — see `messages/{vi,en}.json`'s
 * `awardsPage.longDescription.*` keys.
 */
export const awardDetails: Readonly<Record<string, AwardDetail>> = {
  'top-talent': {
    slug: 'top-talent',
    longDescriptionKey: 'awardsPage.longDescription.topTalent',
    quantity: '10',
    unit: 'Đơn vị',
    value: '7.000.000 VNĐ',
  },
  'top-project': {
    slug: 'top-project',
    longDescriptionKey: 'awardsPage.longDescription.topProject',
    quantity: '02',
    unit: 'Tập thể',
    value: '15.000.000 VNĐ',
  },
  'top-project-leader': {
    slug: 'top-project-leader',
    longDescriptionKey: 'awardsPage.longDescription.topProjectLeader',
    quantity: '03',
    unit: 'Cá nhân',
    value: '7.000.000 VNĐ',
  },
  'best-manager': {
    slug: 'best-manager',
    longDescriptionKey: 'awardsPage.longDescription.bestManager',
    quantity: '01',
    unit: 'Cá nhân',
    value: '10.000.000 VNĐ',
  },
  'signature-2025-creator': {
    slug: 'signature-2025-creator',
    longDescriptionKey: 'awardsPage.longDescription.signature2025Creator',
    quantity: '01',
    unit: '',
    value: '5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)',
  },
  mvp: {
    slug: 'mvp',
    longDescriptionKey: 'awardsPage.longDescription.mvp',
    quantity: '01',
    unit: '',
    value: '15.000.000 VNĐ',
  },
} as const;
