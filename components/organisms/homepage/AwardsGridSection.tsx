import { useTranslations } from 'next-intl';
import { awards } from '@/lib/awards/config';
import { AwardCard } from './AwardCard';

/**
 * The awards-grid section of Homepage SAA. Renders all 6 categories from
 * `lib/awards/config.ts` in 2 columns on narrow viewports and 3 columns on
 * desktop (per spec's responsive notes).
 */
export function AwardsGridSection() {
  const t = useTranslations('homepage.awards.section');
  return (
    <section
      id="awards-overview"
      aria-labelledby="awards-overview-heading"
      className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 lg:px-16"
    >
      <header className="text-center">
        <p className="text-xs uppercase tracking-widest opacity-60">{t('caption')}</p>
        <h2 id="awards-overview-heading" className="mt-3 text-3xl font-semibold tracking-tight">
          {t('title')}
        </h2>
        <p className="mt-3 text-base opacity-80">{t('subtitle')}</p>
      </header>

      <ul className="mt-10 grid grid-cols-2 gap-6 md:gap-8 lg:grid-cols-3">
        {awards.map((award) => (
          <li key={award.slug}>
            <AwardCard award={award} />
          </li>
        ))}
      </ul>
    </section>
  );
}
