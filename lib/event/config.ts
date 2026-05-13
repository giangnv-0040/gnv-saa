/**
 * Event datetime configuration for Homepage SAA's countdown.
 *
 * Source: build-time env var `NEXT_PUBLIC_EVENT_START_AT` (ISO-8601). Per
 * spec FR-006 the value MUST be parseable; invalid/missing values cause the
 * countdown to fall back to `00 00 00` and hide the "Coming soon" sub-label
 * (FR-009).
 *
 * Centralising the env read here makes the helper testable via `vi.stubEnv`.
 */
export function getEventStartAt(): Date | null {
  const raw = process.env.NEXT_PUBLIC_EVENT_START_AT;
  if (typeof raw !== 'string' || raw.trim() === '') return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}
