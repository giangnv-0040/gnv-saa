import { logger } from '@/lib/logger';

/**
 * Event datetime configuration for Homepage SAA's countdown AND the prelaunch
 * gate (Countdown - Prelaunch page).
 *
 * Source: build-time env var `NEXT_PUBLIC_EVENT_START_AT` (ISO-8601). Per
 * spec FR-006 the value MUST be parseable; invalid/missing values cause the
 * countdown to fall back to `00 00 00` and hide the "Coming soon" sub-label
 * (FR-009). Centralising the env read here makes the helper testable via
 * `vi.stubEnv`.
 */
export function getEventStartAt(): Date | null {
  const raw = process.env.NEXT_PUBLIC_EVENT_START_AT;
  if (typeof raw !== 'string' || raw.trim() === '') return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

/**
 * Returns `true` when `NEXT_PUBLIC_EVENT_START_AT` is a valid ISO-8601
 * datetime in the future of `now` (defaults to the current real time).
 *
 * Drives the prelaunch gate in `middleware.ts` (FR-001). Fail-open per
 * FR-009: a missing or unparseable env value returns `false`, i.e. the real
 * app ships rather than locking out every visitor.
 */
export function isPrelaunch(now: Date = new Date()): boolean {
  const target = getEventStartAt();
  if (target === null) return false;
  return target.getTime() > now.getTime();
}

const MAX_RAW_LOG_LENGTH = 64;
let warned = false;

/**
 * Emits one `logger.warn('event.start_at.invalid', { raw })` when the env
 * value is a non-empty unparseable string. Idempotent: at most one warning
 * per worker lifetime (the module-level `warned` flag guards re-entry).
 *
 * Invocation is **lazy** — call this explicitly from `middleware.ts` as the
 * first statement. NOT a module-load side effect; that would fire noisily
 * during Vitest module collection and during `next build`.
 *
 * The `raw` value is truncated to 64 chars to avoid leaking accidentally
 * pasted secrets into the log stream.
 */
export function assertEventStartConfig(): void {
  if (warned) return;
  const raw = process.env.NEXT_PUBLIC_EVENT_START_AT;
  if (typeof raw !== 'string' || raw.trim() === '') return;
  if (!Number.isNaN(new Date(raw).getTime())) return;
  logger.warn('event.start_at.invalid', { raw: raw.slice(0, MAX_RAW_LOG_LENGTH) });
  warned = true;
}

/**
 * Test-only helper that resets the `assertEventStartConfig` idempotence
 * guard. The leading underscores signal "not for production code" — Vitest
 * is the only caller (used in `tests/unit/lib/event/config.test.ts`).
 */
export function __resetEventStartConfigWarning(): void {
  warned = false;
}
