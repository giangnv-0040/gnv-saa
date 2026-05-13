import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Award } from '@/lib/awards/types';
import { AWARD_BACKGROUND_IMAGE } from '@/lib/awards/config';
import { awardDeepLink } from '@/lib/routes';

interface AwardCardProps {
  award: Award;
}

/**
 * A single award category card on Homepage SAA.
 *
 * - The entire card is a single `<Link>` (one tab stop) targeting
 *   `/awards#{slug}` — image, title, and "Chi tiết" affordance share the
 *   activation (FR-013).
 * - Description text uses `line-clamp-2` to truncate at 2 lines per C2.1.3.
 * - Hover effect is opt-in via Tailwind utilities, respecting
 *   `prefers-reduced-motion` (handled globally in `globals.css`).
 */
export function AwardCard({ award }: AwardCardProps) {
  const t = useTranslations();
  const title = t(award.titleKey);
  const description = t(award.descriptionKey);
  const detailLabel = t('homepage.awards.detailLink');

  return (
    <Link
      href={awardDeepLink(award.slug)}
      className="group flex flex-col gap-4 rounded-(--radius-lg) p-4 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:-translate-y-1"
      aria-label={`${title} — ${detailLabel}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-(--radius-md)">
        <Image
          src={AWARD_BACKGROUND_IMAGE}
          alt=""
          aria-hidden
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <Image
            src={award.nameImage}
            alt={title}
            width={232}
            height={64}
            className="h-auto max-h-[50%] w-auto max-w-[80%] object-contain"
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>

      <p className="line-clamp-2 text-sm text-foreground/70">{description}</p>

      <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-cta-foreground/90 group-hover:text-foreground">
        {detailLabel}
        <Image
          src="/assets/homepage/icons/arrow-up-right.svg"
          alt=""
          aria-hidden
          width={20}
          height={20}
          unoptimized
          className="h-5 w-5"
        />
      </span>
    </Link>
  );
}
