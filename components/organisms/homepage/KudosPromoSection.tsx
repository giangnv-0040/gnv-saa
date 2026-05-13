import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/lib/routes';

/**
 * Promo block for Sun* Kudos. Renders the label / title / description / image
 * and a "Chi tiết" CTA that navigates to `/kudos` (FR-016).
 */
export function KudosPromoSection() {
  const t = useTranslations('homepage.kudos');
  return (
    <section
      aria-labelledby="kudos-promo-heading"
      className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 lg:px-16"
    >
      {/* The card sits on the dark page bg; the kudos-bg artwork is brought
          slightly forward (opacity 80) so the card reads as a distinct
          element, not blended with the page bg. */}
      <div className="relative isolate overflow-hidden rounded-(--radius-lg) ring-1 ring-hero-foreground/10">
        <Image
          src="/assets/homepage/images/kudos-bg.png"
          alt=""
          aria-hidden
          fill
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="-z-10 object-cover opacity-80"
        />
        <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 md:p-12">
          <div className="flex flex-col items-start gap-4">
            <p className="text-xs uppercase tracking-widest opacity-80">{t('label')}</p>
            <h2
              id="kudos-promo-heading"
              className="text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {t('title')}
            </h2>
            <p className="text-base opacity-90">{t('description')}</p>
            <Link
              href={ROUTES.KUDOS}
              className="mt-2 inline-flex items-center gap-2 rounded-(--radius-button) bg-cta px-6 py-3 text-sm font-semibold text-cta-foreground transition-opacity hover:opacity-90"
            >
              {t('detailLink')}
              <Image
                src="/assets/homepage/icons/arrow-up-right.svg"
                alt=""
                aria-hidden
                width={20}
                height={20}
                unoptimized
                className="h-5 w-5"
              />
            </Link>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <Image
              src="/assets/homepage/images/kudos-logo.svg"
              alt=""
              aria-hidden
              width={364}
              height={72}
              unoptimized
              className="h-auto w-full max-w-md object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
