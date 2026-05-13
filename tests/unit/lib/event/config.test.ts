import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEventStartAt } from '@/lib/event/config';

afterEach(() => {
  vi.unstubAllEnvs();
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
