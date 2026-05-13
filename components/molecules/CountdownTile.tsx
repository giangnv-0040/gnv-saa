import { padTwoDigits } from '@/lib/event/countdown';

interface CountdownTileProps {
  /** Numeric value (will be 2-digit zero-padded). */
  value: number;
  /** Already-localized unit label (e.g. "DAYS"). */
  label: string;
}

/**
 * A single countdown unit (DAYS / HOURS / MINUTES). Pure display — receives
 * the current value as a prop and renders the 2-digit padded number plus
 * label. No state, no timer.
 */
export function CountdownTile({ value, label }: CountdownTileProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="rounded-(--radius-lg) bg-foreground/5 px-6 py-3 font-display text-4xl font-semibold tabular-nums md:text-5xl"
        data-testid="countdown-value"
      >
        {padTwoDigits(value)}
      </span>
      <span className="text-xs font-medium uppercase tracking-widest text-foreground/70">
        {label}
      </span>
    </div>
  );
}
