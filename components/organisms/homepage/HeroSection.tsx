import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CountdownTimer } from '@/components/molecules/CountdownTimer';
import { getEventStartAt } from '@/lib/event/config';
import { ROUTES } from '@/lib/routes';

/**
 * The Homepage SAA hero. Renders:
 *
 * - The Keyvisual background image (full-bleed).
 * - The "Root" + "Further" logotypes.
 * - The countdown (Client Component, ticks every minute).
 * - The event info block (time + venue + broadcast note).
 * - Two CTAs: "ABOUT AWARDS" → `/awards`, "ABOUT KUDOS" → `/kudos`.
 * - The "Root Further" description paragraphs + quote.
 *
 * Event datetime is read from the build-time env var via `getEventStartAt()`.
 * Invalid/missing values render the FR-009 fallback (00 00 00, no "Coming
 * soon").
 */
export function HeroSection() {
  const t = useTranslations('homepage');
  const tHeader = useTranslations('header');

  const target = getEventStartAt();
  const targetMs = target?.getTime() ?? null;

  return (
    <section
      aria-label={tHeader('nav.about')}
      className="relative isolate w-full overflow-hidden bg-hero-background text-hero-foreground"
    >
      <Image
        src="/assets/homepage/images/keyvisual-bg.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-90"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 py-20 md:px-10 md:py-28 lg:px-16">
        {/* Logotypes */}
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/assets/homepage/images/root-text.png"
            alt={t('hero.rootFurtherAlt')}
            width={189}
            height={67}
            priority
            className="h-auto w-[60vw] max-w-[420px]"
            unoptimized
          />
          <Image
            src="/assets/homepage/images/further-text.png"
            alt=""
            aria-hidden
            width={290}
            height={67}
            priority
            className="h-auto w-[75vw] max-w-[560px]"
            unoptimized
          />
        </div>

        <CountdownTimer targetMs={targetMs} />

        {/* Event info */}
        <dl className="flex flex-col items-center gap-2 text-center text-sm md:flex-row md:gap-8">
          <div className="flex flex-wrap items-baseline justify-center gap-2">
            <dt className="opacity-70">{t('event.timeLabel')}</dt>
            <dd className="font-semibold">{t('event.time')}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-center gap-2">
            <dt className="opacity-70">{t('event.venueLabel')}</dt>
            <dd className="font-semibold">{t('event.venue')}</dd>
          </div>
        </dl>
        <p className="text-xs italic opacity-70">{t('event.broadcast')}</p>

        {/* CTAs */}
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href={ROUTES.AWARDS}
            className="inline-flex items-center justify-center gap-2 rounded-(--radius-button) bg-cta px-6 py-4 text-sm font-semibold text-cta-foreground transition-opacity hover:opacity-90"
          >
            {t('cta.aboutAwards')}
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
          <Link
            href={ROUTES.KUDOS}
            className="inline-flex items-center justify-center gap-2 rounded-(--radius-button) border border-hero-foreground/40 px-6 py-4 text-sm font-semibold transition-colors hover:border-hero-foreground"
          >
            {t('cta.aboutKudos')}
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
      </div>

      {/* Root Further description */}
      <div className="mx-auto w-full max-w-3xl px-6 py-12 text-base leading-relaxed md:px-10 lg:px-16">
        <p className="whitespace-pre-line">{t('description.paragraph1')}</p>
        <blockquote className="mt-8 border-l-2 border-cta pl-4 italic">
          <p className="whitespace-pre-line">{t('description.quote')}</p>
        </blockquote>
        <p className="mt-8 whitespace-pre-line">{t('description.paragraph2')}</p>
      </div>
    </section>
  );
}
