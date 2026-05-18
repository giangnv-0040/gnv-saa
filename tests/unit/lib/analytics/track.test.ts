import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';
import { track } from '@/lib/analytics/track';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('track', () => {
  it('calls logger.info with an "analytics" prefix and the supplied props', () => {
    const spy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    track('prelaunch_view', { remaining_minutes: 42 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('analytics prelaunch_view', { remaining_minutes: 42 });
  });

  it('defaults props to an empty object when omitted', () => {
    const spy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    track('prelaunch_exit');
    expect(spy).toHaveBeenCalledWith('analytics prelaunch_exit', {});
  });

  it('forwards different event names verbatim', () => {
    const spy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    track('countdown_zero', { source: 'prelaunch' });
    expect(spy).toHaveBeenCalledWith('analytics countdown_zero', { source: 'prelaunch' });
  });
});
