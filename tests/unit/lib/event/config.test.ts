import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getEventStartAt,
  isPrelaunch,
  assertEventStartConfig,
  __resetEventStartConfigWarning,
} from '@/lib/event/config';
import { logger } from '@/lib/logger';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  __resetEventStartConfigWarning();
});

describe('getEventStartAt', () => {
  it('returns a Date when env var holds a valid ISO-8601 string', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-12-31T18:30:00+07:00');
    const result = getEventStartAt();
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe('2026-12-31T11:30:00.000Z');
  });

  it('returns null when env var is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '');
    expect(getEventStartAt()).toBeNull();
  });

  it('returns null when env var holds an unparseable string (FR-009)', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', 'not-a-date');
    expect(getEventStartAt()).toBeNull();
  });

  it('returns null when env var holds whitespace only', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '   ');
    expect(getEventStartAt()).toBeNull();
  });
});

describe('isPrelaunch', () => {
  it('returns false when env var is unset (FR-009 fail-open)', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '');
    expect(isPrelaunch()).toBe(false);
  });

  it('returns false when env var is unparseable (FR-009 fail-open)', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', 'not-a-date');
    expect(isPrelaunch()).toBe(false);
  });

  it('returns false when target is in the past', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2025-01-01T00:00:00Z');
    expect(isPrelaunch(new Date('2026-06-01T00:00:00Z'))).toBe(false);
  });

  it('returns true when target is in the future', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-12-31T18:30:00+07:00');
    expect(isPrelaunch(new Date('2026-06-01T00:00:00Z'))).toBe(true);
  });

  it('honors the explicit `now` parameter for deterministic tests', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-06-01T00:01:00Z');
    expect(isPrelaunch(new Date('2026-06-01T00:00:00Z'))).toBe(true);
    expect(isPrelaunch(new Date('2026-06-01T00:02:00Z'))).toBe(false);
  });

  it('defaults `now` to current real time when no parameter is given', () => {
    // Anchor "now" deterministically via fake timers so we don't depend on
    // wall-clock at test execution time.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-12-31T18:30:00+07:00');
    expect(isPrelaunch()).toBe(true);
    vi.useRealTimers();
  });
});

describe('assertEventStartConfig', () => {
  beforeEach(() => {
    __resetEventStartConfigWarning();
  });

  it('emits no warning when env var is empty/unset', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '');
    assertEventStartConfig();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits exactly one warning when env var is a non-empty unparseable string', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', 'not-a-date');
    assertEventStartConfig();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('event.start_at.invalid', { raw: 'not-a-date' });
  });

  it('is idempotent — second invocation in same worker emits no additional warning', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', 'not-a-date');
    assertEventStartConfig();
    assertEventStartConfig();
    assertEventStartConfig();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('truncates raw env value to 64 chars to avoid leaking pasted secrets', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const longGarbage = 'x'.repeat(200);
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', longGarbage);
    assertEventStartConfig();
    expect(spy).toHaveBeenCalledTimes(1);
    const [, ctx] = spy.mock.calls[0]!;
    expect((ctx as { raw: string }).raw).toHaveLength(64);
    expect((ctx as { raw: string }).raw).toBe('x'.repeat(64));
  });

  it('emits no warning when env var is a valid date', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-12-31T18:30:00+07:00');
    assertEventStartConfig();
    expect(spy).not.toHaveBeenCalled();
  });

  it('`__resetEventStartConfigWarning()` clears the idempotence guard for tests', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', 'not-a-date');
    assertEventStartConfig();
    expect(spy).toHaveBeenCalledTimes(1);
    __resetEventStartConfigWarning();
    assertEventStartConfig();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
