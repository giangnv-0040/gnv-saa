import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CountdownTimer } from '@/components/molecules/CountdownTimer';
import { getEventStartAt } from '@/lib/event/config';
import { ROUTES } from '@/lib/routes';

/**
 * The Homepage SAA hero.
 *
 * One dark navy `<section>` carrying two visual zones (per Figma):
 *
 * 1. **Coming-soon zone** — top: logotype + countdown + event info + CTAs
 *    in the left column; the keyvisual background art spans full width.
 * 2. **Root Further watermark** — bottom: the wide ROOT FURTHER wordmark
 *    (`MM_MEDIA_Root Further Logo`) rendered centred. Acts as a visual
 *    separator between the hero content and the description block.
 *
 * Below this `<section>`, the description block sits in its own `<section>`
 * with a plain dark navy background (no bg-art bleed-through onto long
 * paragraphs).
 *
 * Event datetime is read from `NEXT_PUBLIC_EVENT_START_AT`. Invalid/missing
 * values render the FR-009 fallback (00 00 00, no "Coming soon").
 */
export function HeroSection() {
  const t = useTranslations('homepage');
  const tHeader = useTranslations('header');

  const target = getEventStartAt();
  const targetMs = target?.getTime() ?? null;

  return (
    <>
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
          className="-z-20 object-cover object-right"
        />

        {/* Bottom-fade gradient — smoothly blends the colourful keyvisual
            into the dark navy of the description block below. Without this
            the transition is an abrupt hard edge between art and plain bg. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,16,26,0) 0%, rgba(0,16,26,0.55) 50%, rgba(0,16,26,0.95) 90%, rgba(0,16,26,1) 100%)',
          }}
        />

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 pt-20 md:grid-cols-2 md:px-10 md:pt-24 lg:px-16">
          <div className="flex max-w-xl flex-col items-start gap-8 md:gap-10">
            {/* Stacked Root + Further logotype */}
            <div className="flex flex-col items-start gap-2">
              <Image
                src="/assets/homepage/images/root-text.png"
                alt={t('hero.rootFurtherAlt')}
                width={189}
                height={67}
                priority
                unoptimized
                className="h-auto w-[55vw] max-w-[260px]"
              />
              <Image
                src="/assets/homepage/images/further-text.png"
                alt=""
                aria-hidden
                width={290}
                height={67}
                priority
                unoptimized
                className="h-auto w-[72vw] max-w-[360px]"
              />
            </div>

            <CountdownTimer targetMs={targetMs} />

            {/* Event info — labels muted, values gold. The broadcast note
                hugs the time/venue row (tight intra-block gap) per Figma. */}
            <div className="flex flex-col items-start gap-1">
              <dl className="flex flex-col items-start gap-2 text-base md:flex-row md:flex-wrap md:gap-x-8">
                <div className="flex items-baseline gap-2">
                  <dt className="opacity-80">{t('event.timeLabel')}</dt>
                  <dd className="font-semibold text-cta">{t('event.time')}</dd>
                </div>
                <div className="flex items-baseline gap-2">
                  <dt className="opacity-80">{t('event.venueLabel')}</dt>
                  <dd className="font-semibold text-cta">{t('event.venue')}</dd>
                </div>
              </dl>
              <p className="text-sm italic opacity-80">{t('event.broadcast')}</p>
            </div>

            {/* CTAs — per spec B3.1 / B3.2 the buttons share Hover/Normal
                states but display different states in the Figma preview:
                ABOUT AWARDS renders the hover state by default (yellow fill
                + dark text/icon); ABOUT KUDOS renders the normal state by
                default (outline + white text/icon, swaps to yellow on
                hover). Arrow SVG uses `fill="currentColor"` so it inherits
                each button's current text colour. */}
            <div className="flex flex-row flex-wrap gap-4">
              <Link
                href={ROUTES.AWARDS}
                className="inline-flex items-center gap-2 rounded-(--radius-button) bg-cta px-6 py-3 text-sm font-semibold text-cta-foreground transition-opacity hover:opacity-90"
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
                className="inline-flex items-center gap-2 rounded-(--radius-button) border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-cta hover:bg-cta hover:text-cta-foreground"
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

          {/* Right column: intentionally empty — keyvisual-bg.png fills it. */}
          <div className="hidden md:block" aria-hidden />
        </div>

        {/* Root Further watermark — separates the coming-soon zone from
            the description block. Decorative; aria-hidden. Sized smaller
            than the top stacked Root/Further logotype and tightly spaced
            against the description paragraphs below per Figma. */}
        <div className="relative mx-auto mt-16 flex w-full max-w-7xl justify-center px-6 pb-2 md:mt-24 md:px-10 md:pb-4 lg:px-16">
          <Image
            src="/assets/homepage/images/root-further-logo.png"
            alt=""
            aria-hidden
            width={451}
            height={200}
            unoptimized
            className="h-auto w-full max-w-[180px] opacity-90 md:max-w-[260px]"
          />
        </div>
      </section>

      {/* Description block — separate section, narrow column, plain bg.
          Top padding is kept small so the watermark above sits close to the
          first paragraph, matching the tight gap shown in Figma. */}
      <section aria-label="Root Further" className="w-full bg-hero-background text-hero-foreground">
        <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-4 text-base leading-relaxed md:px-10 md:pt-6 lg:px-16">
          <p className="whitespace-pre-line">{t('description.paragraph1')}</p>
          <blockquote className="mt-8 border-l-2 border-cta pl-4 italic">
            <p className="whitespace-pre-line">{t('description.quote')}</p>
          </blockquote>
          <p className="mt-8 whitespace-pre-line">{t('description.paragraph2')}</p>
        </div>
      </section>
    </>
  );
}
