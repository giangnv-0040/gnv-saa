import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Award, AwardDetail } from '@/lib/awards/types';
import { AWARD_BACKGROUND_IMAGE } from '@/lib/awards/config';

interface AwardDetailCardProps {
  award: Award;
  detail: AwardDetail;
}

/**
 * Single award detail block on Hệ thống giải. Wraps the content in a
 * `<section id={slug}>` so sidebar anchor links + Homepage deep links land
 * on the right element.
 *
 * Image: composes the shared `award-bg.png` background with the per-award
 * name overlay (`award.nameImage`). Decorative — `alt=""` since the
 * `<h2>` title carries the meaning.
 *
 * Quantity + value rows use `target.svg` / `license.svg` icons coloured
 * by parent text (icons use `fill="currentColor"`).
 */
export function AwardDetailCard({ award, detail }: AwardDetailCardProps) {
  const t = useTranslations();
  const title = t(award.titleKey);
  const description = t(detail.longDescriptionKey);
  const quantityLabel = t('awardsPage.quantityLabel');
  const valueLabel = t('awardsPage.valueLabel');
  const perAwardSuffix = t('awardsPage.perAwardSuffix');
  const headingId = `${award.slug}-heading`;

  return (
    <section
      id={award.slug}
      aria-labelledby={headingId}
      className="grid grid-cols-1 gap-6 scroll-mt-24 md:grid-cols-[336px_1fr] md:gap-10"
    >
      {/* Award imagery — bg + per-award name overlay. Decorative. */}
      <div className="relative aspect-square w-full overflow-hidden rounded-(--radius-lg) md:w-[336px]">
        <Image
          src={AWARD_BACKGROUND_IMAGE}
          alt=""
          aria-hidden
          fill
          sizes="(min-width: 768px) 336px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <Image
            src={award.nameImage}
            alt=""
            aria-hidden
            width={232}
            height={64}
            className="h-auto max-h-[35%] w-auto max-w-[80%] object-contain"
          />
        </div>
      </div>

      {/* Content column — title + long description + qty + value. */}
      <div className="flex flex-col items-start gap-4 md:gap-5">
        <h2 id={headingId} className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h2>
        <p className="text-base leading-relaxed opacity-90">{description}</p>

        <dl className="mt-2 flex flex-col gap-3 text-sm md:text-base">
          <div className="flex items-baseline gap-3">
            <Image
              src="/assets/awards/icons/target.svg"
              alt=""
              aria-hidden
              width={20}
              height={20}
              unoptimized
              className="h-5 w-5 shrink-0 text-cta"
            />
            <dt className="opacity-80">{quantityLabel}</dt>
            <dd className="font-semibold text-cta">{detail.quantity}</dd>
            {detail.unit ? <dd className="opacity-90">{detail.unit}</dd> : null}
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <Image
              src="/assets/awards/icons/license.svg"
              alt=""
              aria-hidden
              width={20}
              height={20}
              unoptimized
              className="h-5 w-5 shrink-0 text-cta"
            />
            <dt className="opacity-80">{valueLabel}</dt>
            <dd className="font-semibold text-cta">{detail.value}</dd>
            {detail.unit ? <dd className="text-sm italic opacity-70">{perAwardSuffix}</dd> : null}
          </div>
        </dl>
      </div>
    </section>
  );
}
