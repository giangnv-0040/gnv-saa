import { PrelaunchBackground } from '@/components/atoms/PrelaunchBackground';
import { PrelaunchTimer } from './PrelaunchTimer';

interface PrelaunchHeroProps {
  /**
   * Already-localized headline string (e.g. "Sự kiện sẽ bắt đầu sau"). The
   * page passes `t('heading')` resolved via `getTranslations('prelaunch')`.
   */
  headline: string;
  /**
   * Event datetime as milliseconds since epoch, or `null` when the env is
   * unset/unparseable/past (decision #11 — collapses to `null` so the
   * Timer renders `--` placeholders).
   */
  targetMs: number | null;
}

/**
 * Prelaunch hero organism — composes the full-bleed background, the
 * absolutely-centered headline, and the countdown timer. Server Component
 * so the initial digit values are server-truth (FR-013, no FOUC).
 */
export function PrelaunchHero({ headline, targetMs }: PrelaunchHeroProps) {
  return (
    <section
      className="relative isolate min-h-dvh w-full overflow-hidden bg-hero-background text-hero-foreground"
      aria-labelledby="prelaunch-heading"
    >
      <PrelaunchBackground />
      <div className="relative z-0 flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-16 md:gap-8 md:px-12">
        <h1
          id="prelaunch-heading"
          className="text-center text-xl font-bold leading-snug opacity-95 md:text-2xl"
        >
          {headline}
        </h1>
        <PrelaunchTimer targetMs={targetMs} />
      </div>
    </section>
  );
}
