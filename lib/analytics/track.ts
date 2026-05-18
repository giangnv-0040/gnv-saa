import { logger } from '@/lib/logger';

/**
 * MVP analytics seam. Wraps `logger.info` so the call sites that emit
 * `prelaunch_view`, `countdown_zero`, and `prelaunch_exit` exist today and
 * can be re-pointed to a real SDK (Segment, Amplitude, internal pipeline)
 * later without touching the call sites.
 *
 * The decision to ship MVP via logger.info is captured in the prelaunch
 * plan §Violations — US4 (analytics) is P3 and shipping the SDK now would
 * bloat the bundle for a low-priority concern.
 */
export function track(event: string, props: Record<string, unknown> = {}): void {
  logger.info(`analytics ${event}`, props);
}
