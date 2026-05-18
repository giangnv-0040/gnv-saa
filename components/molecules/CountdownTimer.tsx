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
  /**
   * Suppress the "Coming soon" sub-label that normally appears above the
   * tiles before the event starts. Used by the prelaunch hero (plan
   * decision #1) — it owns its own headline. Default: `false` (Homepage
   * SAA's existing behavior preserved).
   */
  hideComingSoon?: boolean;
  /**
   * i18n namespace used to resolve the unit labels (`days`, `hours`,
   * `minutes`, `ariaLabel`). The prelaunch hero passes `'prelaunch.units'`
   * (plan decision #1). Default: `'homepage.countdown'` (Homepage SAA's
   * existing call site).
   */
  translationNamespace?: string;
  /**
   * i18n namespace used to resolve the "Coming soon" sub-label. Only
   * consulted when `hideComingSoon` is `false`. Default:
   * `'homepage.hero'` (Homepage SAA's existing call site).
   */
  comingSoonNamespace?: string;
  /**
   * When `true` AND `targetMs` is `null`, the tiles render the
   * `placeholder` string instead of `00` (plan decision #2 / FR-009 for the
   * prelaunch direct-visit branch). Default: `false` (Homepage SAA keeps
   * showing zeros when the env is missing — matches its existing behavior).
   */
  showPlaceholderOnNull?: boolean;
  /**
   * String forwarded to each `CountdownTile.placeholder` when
   * `showPlaceholderOnNull && targetMs === null`. Default: `'--'`.
   */
  placeholder?: string;
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
 *
 * Visibility resync (FR-011): a `visibilitychange` listener triggers an
 * out-of-band `tick()` whenever the tab regains attention, so the values
 * jump to the correct remaining time after a long background sleep instead
 * of decrementing from the stale last-paint value.
 */
export function CountdownTimer({
  targetMs,
  hideComingSoon = false,
  translationNamespace = 'homepage.countdown',
  comingSoonNamespace = 'homepage.hero',
  showPlaceholderOnNull = false,
  placeholder = '--',
}: CountdownTimerProps) {
  const t = useTranslations(translationNamespace);
  const tComingSoon = useTranslations(comingSoonNamespace);
  const target = targetMs !== null ? new Date(targetMs) : null;

  const [value, setValue] = useState<CountdownValue>(() => computeCountdown(new Date(), target));

  useEffect(() => {
    if (target === null || value.started) return;

    const tick = () => {
      const next = computeCountdown(new Date(), target);
      setValue(next);
    };
    const onVisibilityChange = () => {
      // Resync from wall-clock whenever the tab regains attention. Cheap
      // and idempotent; covers throttled `setInterval` after a long hide.
      tick();
    };

    // Tick once immediately to correct any server/client clock drift, then
    // every 60 s.
    tick();
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // We intentionally omit `value.started` from deps — once started we leave
    // the interval untouched and rely on the early-return on next mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs]);

  const renderPlaceholder = showPlaceholderOnNull && targetMs === null;

  return (
    <div className="flex flex-col items-start gap-4 md:gap-5">
      {!hideComingSoon && !value.started ? (
        <p className="text-xl font-bold leading-snug opacity-95 md:text-2xl">
          {tComingSoon('comingSoon')}
        </p>
      ) : null}

      <div
        role="timer"
        aria-live="polite"
        aria-label={t('ariaLabel')}
        className="flex items-start gap-6 md:gap-10"
      >
        <CountdownTile
          value={value.days}
          label={t('days')}
          placeholder={renderPlaceholder ? placeholder : undefined}
        />
        <CountdownTile
          value={value.hours}
          label={t('hours')}
          placeholder={renderPlaceholder ? placeholder : undefined}
        />
        <CountdownTile
          value={value.minutes}
          label={t('minutes')}
          placeholder={renderPlaceholder ? placeholder : undefined}
        />
      </div>
    </div>
  );
}
