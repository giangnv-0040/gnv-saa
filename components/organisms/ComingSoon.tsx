import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/lib/routes';

interface ComingSoonProps {
  /**
   * Already-localized name of the screen being placeholdered (e.g. via
   * `t('placeholders.awards')`). Rendered as the subtitle.
   */
  screenName: string;
}

/**
 * Shared "Coming soon" placeholder rendered by the 8 stub pages that exist
 * solely to satisfy Homepage SAA's navigation (`/awards`, `/kudos`, …).
 *
 * Each route is replaced by its owning spec when that screen ships; until
 * then this component prevents broken-link errors and gives the user a clear
 * way home (spec Test ID-59 + plan §Phase 1.5).
 */
export function ComingSoon({ screenName }: ComingSoonProps) {
  const t = useTranslations('comingSoon');
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm uppercase tracking-widest text-foreground/60">{screenName}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-3 max-w-md text-base text-foreground/70">{t('message')}</p>
      <Link
        href={ROUTES.HOME}
        className="mt-8 inline-flex items-center rounded-(--radius-button) bg-cta px-6 py-3 text-sm font-semibold text-cta-foreground hover:opacity-90"
      >
        {t('backHome')}
      </Link>
    </main>
  );
}
