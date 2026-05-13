import { padTwoDigits } from '@/lib/event/countdown';

interface CountdownTileProps {
  /** Numeric value (will be 2-digit zero-padded into two digit tiles). */
  value: number;
  /** Already-localized unit label (e.g. "DAYS"). */
  label: string;
}

const MAX_DISPLAY_VALUE = 99;

/**
 * A single countdown unit (DAYS / HOURS / MINUTES). Per Figma's
 * `mms_B1.3.x` spec, each unit renders **exactly two digit tiles** — one
 * per character of the 2-digit zero-padded value. The design tops out at
 * 99 (hours/minutes can't exceed naturally; days are clamped at 99 so the
 * 2-tile layout stays symmetric across all three units).
 *
 * Each tile applies a half-transparent gradient + 0.5px yellow border +
 * 8px radius + backdrop blur, mimicking the split-flap glass effect with
 * a hairline divider through the vertical centre.
 *
 * Screen readers see the un-split 2-digit value (the visible per-digit
 * tiles are `aria-hidden`) so announcements stay readable.
 */
export function CountdownTile({ value, label }: CountdownTileProps) {
  const clamped = Math.min(Math.max(0, Math.floor(value)), MAX_DISPLAY_VALUE);
  const padded = padTwoDigits(clamped);
  const digits = padded.split('');

  return (
    <div className="flex flex-col items-start gap-3 md:gap-4">
      <div className="flex items-center gap-2 md:gap-3.5">
        <span className="sr-only" data-testid="countdown-value">
          {padded}
        </span>
        {digits.map((digit, idx) => (
          <DigitTile key={idx} digit={digit} />
        ))}
      </div>
      <span className="text-base font-bold uppercase tracking-wide opacity-90 md:text-2xl">
        {label}
      </span>
    </div>
  );
}

function DigitTile({ digit }: { digit: string }) {
  return (
    <div
      aria-hidden
      className="relative isolate flex h-16 w-12 items-center justify-center md:h-20 md:w-[51px]"
    >
      {/* Background — gradient + border + blur, opacity 0.5 per Figma rectangle.
          Sits behind the digit so the half-transparency doesn't dim the number. */}
      <div
        className="absolute inset-0 rounded-(--radius-md) border-[0.5px] border-cta opacity-50 backdrop-blur-md"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.1) 100%)',
        }}
      />
      {/* Split-flap hairline at the vertical centre — mimics the split-flap
          display effect from Figma. */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-hero-background/40" />

      <span
        className="relative font-digital text-3xl leading-none text-hero-foreground md:text-[42px]"
        style={{ fontFamily: 'var(--font-digital, "Courier New", monospace)' }}
      >
        {digit}
      </span>
    </div>
  );
}
