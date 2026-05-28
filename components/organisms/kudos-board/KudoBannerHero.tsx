import Image from 'next/image';
import { useTranslations } from 'next-intl';

/**
 * Banner KV Kudos — full-bleed hero at the top of `/kudos`.
 *
 * Per Figma frame `MaZUn5xHXZ` → `Keyvisual` (2940:13432):
 * - `MM_MEDIA_KV Background`: 1440×512 hero artwork, anchored at the top.
 * - `Cover`: linear-gradient(25deg, #00101A 14.74%, rgba(0, 19, 32, 0.00)
 *   47.8%) — dark navy fade that begins ~445px from the top of the page so
 *   the hero blends into the rest of the dark-themed live board below.
 *
 * The Keyvisual sits BEHIND the header band (`HomepageHeader` is
 * `position:absolute` / `z-index:10` from the page composer), and the
 * gradient covers the bottom portion of the hero to mute the artwork as it
 * meets the HIGHLIGHT KUDOS section.
 */
export function KudoBannerHero() {
  const t = useTranslations('kudos.live.hero');

  return (
    <section className="relative isolate w-full overflow-hidden text-hero-foreground">
      {/* Keyvisual background: 1440×512 PNG positioned at the top, fades into navy. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[512px] w-full">
        <Image
          src="/assets/kudos/keyvisual-bg.png"
          alt=""
          width={1440}
          height={512}
          priority
          className="h-full w-full object-cover"
        />
      </div>

      {/* Cover gradient — dark navy fade over the lower portion of the hero. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[512px] w-full"
        style={{
          background: 'linear-gradient(25deg, #00101A 14.74%, rgba(0, 19, 32, 0.00) 47.8%)',
        }}
      />

      {/* Hero content sits over the keyvisual. Title + KUDOS logo are
          left-aligned and constrained to the same `max-w-7xl` gutter the rest
          of the live board uses, so on a 1440px viewport they land at the
          Figma's 144px left margin (Frame 487: padding 0 144px). */}
      <div className="relative mx-auto flex h-[420px] w-full max-w-7xl flex-col items-start justify-start gap-3 px-6 pt-16 text-left md:h-[460px] md:px-10 md:pt-24 lg:px-16">
        <p className="text-base font-semibold uppercase tracking-wide text-hero-foreground/90 md:text-lg">
          {t('title')}
        </p>
        <Image
          src="/assets/kudos/kudos-logo.svg"
          alt={t('logoAlt')}
          width={593}
          height={104}
          priority
          className="h-auto w-[320px] md:w-[500px] lg:w-[593px]"
        />
      </div>
    </section>
  );
}
