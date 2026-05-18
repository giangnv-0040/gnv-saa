import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getEventStartAt, isPrelaunch } from '@/lib/event/config';
import { PrelaunchHero } from '@/components/organisms/prelaunch/PrelaunchHero';

/**
 * Prelaunch page (rewrite target). Renders for every in-scope request while
 * `isPrelaunch()` returns `true` (middleware rewrites the URL to this path
 * without mutating the address bar — spec _Notes — Routing strategy_).
 *
 * Direct visits to `/prelaunch` are also allowed: when the env is
 * unset/unparseable/past, `targetMs` collapses to `null` and the Timer
 * renders `--` placeholders (decision #6 + FR-009).
 */
export const metadata: Metadata = {
  // FR-014: never index the prelaunch page in search engines.
  robots: { index: false, follow: false },
};

export default async function PrelaunchPage() {
  const t = await getTranslations('prelaunch');

  // Decision #11: only pass a real `targetMs` when the event is genuinely in
  // the future. Unset / unparseable / past env all collapse to `null`, which
  // drives the `--` placeholder branch (decision #6 + FR-009). This means the
  // page is robust to staging dry-runs and to QA bookmarks during launched
  // periods.
  const target = getEventStartAt();
  const targetMs = target !== null && isPrelaunch() ? target.getTime() : null;

  return (
    <main
      tabIndex={-1}
      className="relative isolate min-h-dvh overflow-hidden bg-hero-background text-hero-foreground"
    >
      <PrelaunchHero headline={t('heading')} targetMs={targetMs} />
    </main>
  );
}
