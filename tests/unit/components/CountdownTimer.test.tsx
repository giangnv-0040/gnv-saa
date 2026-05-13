import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { CountdownTimer } from '@/components/molecules/CountdownTimer';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  // Anchor "now" deterministically.
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('<CountdownTimer> — happy path', () => {
  it('renders DD/HH/MM tiles with 2-digit values and "Coming soon" sub-label', () => {
    const target = new Date('2026-01-06T05:09:00Z').getTime(); // 5d 5h 9m
    render(wrap(<CountdownTimer targetMs={target} />));

    const tiles = screen.getAllByTestId('countdown-value');
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toHaveTextContent('05');
    expect(tiles[1]).toHaveTextContent('05');
    expect(tiles[2]).toHaveTextContent('09');
    expect(screen.getByText(viMessages.homepage.hero.comingSoon)).toBeInTheDocument();
  });

  it('decrements the Minutes tile after one minute (FR-008)', () => {
    const target = new Date('2026-01-01T00:10:00Z').getTime(); // 10 minutes away
    render(wrap(<CountdownTimer targetMs={target} />));
    expect(screen.getAllByTestId('countdown-value')[2]).toHaveTextContent('10');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getAllByTestId('countdown-value')[2]).toHaveTextContent('09');
  });

  it('wraps the timer in an aria-live="polite" region with timer role', () => {
    const target = new Date('2026-01-02T00:00:00Z').getTime();
    const { container } = render(wrap(<CountdownTimer targetMs={target} />));
    const region = container.querySelector('[role="timer"]');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-live', 'polite');
  });
});

describe('<CountdownTimer> — fallbacks (FR-009)', () => {
  it('renders 00 00 00 and hides "Coming soon" when targetMs is null', () => {
    render(wrap(<CountdownTimer targetMs={null} />));
    const tiles = screen.getAllByTestId('countdown-value');
    expect(tiles.map((t) => t.textContent)).toEqual(['00', '00', '00']);
    expect(screen.queryByText(viMessages.homepage.hero.comingSoon)).toBeNull();
  });

  it('renders 00 00 00 and hides "Coming soon" when target is in the past', () => {
    const past = new Date('2025-12-31T00:00:00Z').getTime();
    render(wrap(<CountdownTimer targetMs={past} />));
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '00',
      '00',
      '00',
    ]);
    expect(screen.queryByText(viMessages.homepage.hero.comingSoon)).toBeNull();
  });

  it('stops ticking once started (no further updates after event time passes)', () => {
    const target = new Date('2026-01-01T00:00:30Z').getTime(); // 30s away — under 1 minute → reads as 0
    render(wrap(<CountdownTimer targetMs={target} />));
    expect(screen.getAllByTestId('countdown-value')[2]).toHaveTextContent('00');

    // Advance past the target — values should stay at 00 00 00, no crash.
    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '00',
      '00',
      '00',
    ]);
  });
});
