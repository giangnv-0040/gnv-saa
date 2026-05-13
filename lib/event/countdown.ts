/**
 * Result of comparing `now` to the event target.
 *
 * `started` is true when the target has been reached, the target is in the
 * past, or no target was supplied (FR-009 fallback). Consumers MUST treat
 * `started` as a hint to (a) freeze the countdown at 00/00/00 and (b) hide
 * the "Coming soon" sub-label.
 */
export interface CountdownValue {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly started: boolean;
}

const STARTED: CountdownValue = { days: 0, hours: 0, minutes: 0, started: true };

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MINUTES_PER_DAY = MINUTES_PER_HOUR * HOURS_PER_DAY;

/**
 * Compute the remaining DD/HH/MM between `now` and `target`. Pure function —
 * no side effects, no env access. Always recomputes from the current
 * wall-clock (caller passes `now`), never accumulates a counter (plan
 * §Notes — tolerate tab backgrounding and clock skew).
 */
export function computeCountdown(now: Date, target: Date | null): CountdownValue {
  if (target === null) return STARTED;

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return STARTED;

  const totalMinutes = Math.floor(diffMs / MS_PER_MINUTE);
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const remainderAfterDays = totalMinutes - days * MINUTES_PER_DAY;
  const hours = Math.floor(remainderAfterDays / MINUTES_PER_HOUR);
  const minutes = remainderAfterDays - hours * MINUTES_PER_HOUR;

  return { days, hours, minutes, started: false };
}

/** Pad a single tile value to two digits ("05", "00", "12"). */
export function padTwoDigits(value: number): string {
  const clamped = Math.max(0, Math.floor(value));
  return clamped.toString().padStart(2, '0');
}
