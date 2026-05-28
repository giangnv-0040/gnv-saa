#!/usr/bin/env node
/**
 * Verify the three locale files (`vi.json`, `en.json`, `ja.json`) share the
 * same set of keys. Exits with code 1 (and prints a diff) on mismatch so it
 * can wedge into the lint pipeline / CI to catch regressions when a feature
 * adds a key in one locale but forgets the others.
 *
 * Treat `vi.json` as the authority — when EN or JA is missing a key, that's
 * the side that needs filling. Extras in EN or JA are still flagged: a key
 * that exists in only one locale is a bug.
 *
 * Usage:
 *   node scripts/check-i18n-parity.mjs
 *   npm run check:i18n
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = path.join(projectRoot, 'messages');

const LOCALES = ['vi', 'en', 'ja'];

function loadLocale(locale) {
  const file = path.join(messagesDir, `${locale}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function flatten(obj, prefix = '') {
  const out = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flatten(value, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

const flats = Object.fromEntries(
  LOCALES.map((locale) => [locale, new Set(flatten(loadLocale(locale)))]),
);

const reference = flats.vi;
const problems = [];

for (const locale of LOCALES) {
  if (locale === 'vi') continue;
  const missing = [...reference].filter((k) => !flats[locale].has(k));
  const extra = [...flats[locale]].filter((k) => !reference.has(k));
  if (missing.length > 0) {
    problems.push({ locale, kind: 'missing', keys: missing });
  }
  if (extra.length > 0) {
    problems.push({ locale, kind: 'extra', keys: extra });
  }
}

if (problems.length === 0) {
  const total = reference.size;
  console.log(`✓ i18n parity OK — ${total} keys × ${LOCALES.length} locales`);
  process.exit(0);
}

console.error('✗ i18n parity FAILED');
for (const { locale, kind, keys } of problems) {
  const label = kind === 'missing' ? `Missing in ${locale}` : `Extra in ${locale}`;
  console.error(`\n  ${label} (${keys.length}):`);
  for (const key of keys) console.error(`    - ${key}`);
}
console.error('\nFix: copy the missing keys from `messages/vi.json` and translate.');
process.exit(1);
