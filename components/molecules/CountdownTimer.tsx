'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { computeCountdown, type CountdownValue } from '@/lib/event/countdown';
import { CountdownTile } from './CountdownTile';

interface CountdownTimerProps {
  /**
   * Event datetime as milliseconds since epoch. Pass `null` to render the
   * FR-009 fallback (00 00 00, started=true, no "Coming soon" sub-label).
   * The Hero passes `getEventStartAt()?.getTime() ?? null` from the Server
   * Component.
   */
  targetMs: number | null;
}

/**
 * Client-side countdown that recomputes from `Date.now()` on every tick
 * (FR-008). The interval runs every 60 s — the design only displays
 * DD/HH/MM, so finer granularity wastes CPU and creates noisy
 * `aria-live` announcements. Computing from wall-clock instead of
 * accumulating tolerates tab backgrounding and clock skew.
 *
 * The 60-second tick rate naturally rate-limits the `aria-live="polite"`
 * region; no extra bookkeeping is needed to suppress mid-minute re-renders
 * because the state simply does not change between minute boundaries.
 */
export function CountdownTimer({ targetMs }: CountdownTimerProps) {
  const t = useTranslations('homepage.countdown');
  const tHero = useTranslations('homepage.hero');
  const target = targetMs !== null ? new Date(targetMs) : null;

  const [value, setValue] = useState<CountdownValue>(() => computeCountdown(new Date(), target));

  useEffect(() => {
    if (target === null || value.started) return;

    const tick = () => {
      const next = computeCountdown(new Date(), target);
      setValue(next);
    };
    // Tick once immediately to correct any server/client clock drift, then
    // every 60 s.
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
    // We intentionally omit `value.started` from deps — once started we leave
    // the interval untouched and rely on the early-return on next mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs]);

  return (
    <div className="flex flex-col items-center gap-4">
      {!value.started ? (
        <p className="text-sm uppercase tracking-widest text-foreground/70">
          {tHero('comingSoon')}
        </p>
      ) : null}

      <div
        role="timer"
        aria-live="polite"
        aria-label={t('ariaLabel')}
        className="flex items-center justify-center gap-4 md:gap-6"
      >
        <CountdownTile value={value.days} label={t('days')} />
        <CountdownTile value={value.hours} label={t('hours')} />
        <CountdownTile value={value.minutes} label={t('minutes')} />
      </div>
    </div>
  );
}
