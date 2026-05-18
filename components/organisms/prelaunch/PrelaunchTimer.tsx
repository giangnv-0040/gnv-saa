'use client';

import { CountdownTimer } from '@/components/molecules/CountdownTimer';

interface PrelaunchTimerProps {
  /**
   * Event datetime as milliseconds since epoch, or `null` when the env is
   * unset/unparseable/past (drives the `--` placeholder branch per
   * decisions #2 + #11).
   */
  targetMs: number | null;
}

/**
 * Client wrapper around the shared `<CountdownTimer>` for the prelaunch
 * hero. Currently it forwards the prelaunch-specific props and serves as
 * the future install point for:
 *
 * - `onZero` → `router.refresh()` + `track('countdown_zero')` (Phase 5 / US2)
 * - `useEffect` → `track('prelaunch_view', { remaining_minutes })` (Phase 5 / US2)
 *
 * Keeping these behind a wrapper avoids polluting Homepage SAA's call site
 * with prelaunch-specific concerns.
 */
export function PrelaunchTimer({ targetMs }: PrelaunchTimerProps) {
  return (
    <CountdownTimer
      targetMs={targetMs}
      translationNamespace="prelaunch.units"
      hideComingSoon
      showPlaceholderOnNull
    />
  );
}
