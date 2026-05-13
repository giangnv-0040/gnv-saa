import { describe, expect, it } from 'vitest';
import { computeCountdown, padTwoDigits } from '@/lib/event/countdown';

describe('computeCountdown', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('returns started=true when target is null (FR-009 fallback)', () => {
    const result = computeCountdown(now, null);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, started: true });
  });

  it('returns started=true when target is in the past', () => {
    const past = new Date(now.getTime() - 60_000);
    expect(computeCountdown(now, past).started).toBe(true);
  });

  it('returns started=true when target equals now', () => {
    expect(computeCountdown(now, now).started).toBe(true);
  });

  it('counts DD/HH/MM correctly for a future target', () => {
    const target = new Date('2026-01-06T05:09:00Z'); // 5d 5h 9m later
    const result = computeCountdown(now, target);
    expect(result).toEqual({ days: 5, hours: 5, minutes: 9, started: false });
  });

  it('handles sub-minute remainders by flooring to whole minutes', () => {
    const target = new Date(now.getTime() + 90_000); // 1m 30s
    expect(computeCountdown(now, target)).toEqual({
      days: 0,
      hours: 0,
      minutes: 1,
      started: false,
    });
  });

  it('handles exactly 24 hours by rolling into 1 day', () => {
    const target = new Date(now.getTime() + 24 * 60 * 60_000);
    expect(computeCountdown(now, target)).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
      started: false,
    });
  });
});

describe('padTwoDigits', () => {
  it.each([
    [0, '00'],
    [1, '01'],
    [9, '09'],
    [10, '10'],
    [99, '99'],
    [100, '100'], // 3-digit days are preserved as-is
  ])('pads %i to %s', (input, expected) => {
    expect(padTwoDigits(input)).toBe(expected);
  });

  it('clamps negatives to 00', () => {
    expect(padTwoDigits(-5)).toBe('00');
  });
});
