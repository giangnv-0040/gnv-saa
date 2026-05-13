// Supported locales. Narrowed from ['vi','en','ja'] to ['vi','en'] for Homepage
// SAA (spec FR-024). messages/ja.json is left in the repo as soft-deprecated; no
// consumer references it. Re-add 'ja' here if a future screen requires it.
export const locales = ['vi', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'vi';

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
