import { useTranslations } from 'next-intl';

/**
 * Title block for the Awards Information page. Renders the small uppercase
 * caption ("Sun* annual awards 2025") and the main heading ("Hệ thống giải
 * thưởng SAA 2025"). The heading is the page's `<h1>` (the keyvisual above
 * is decorative).
 */
export function AwardsPageTitle() {
  const t = useTranslations('awardsPage');
  return (
    <header className="mx-auto w-full max-w-6xl px-6 py-10 text-center md:px-10 md:py-14 lg:px-16">
      <p className="text-xs uppercase tracking-widest opacity-60">{t('pageCaption')}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cta md:text-4xl">
        {t('pageTitle')}
      </h1>
    </header>
  );
}
