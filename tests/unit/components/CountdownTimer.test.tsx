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

describe('<CountdownTimer> — prelaunch extensions (plan decisions #1, #2)', () => {
  it('hideComingSoon=true suppresses the "Coming soon" sub-label even when targetMs is in the future', () => {
    const target = new Date('2026-01-06T05:09:00Z').getTime();
    render(wrap(<CountdownTimer targetMs={target} hideComingSoon />));
    expect(screen.queryByText(viMessages.homepage.hero.comingSoon)).toBeNull();
    // Tiles still render normally.
    expect(screen.getAllByTestId('countdown-value')).toHaveLength(3);
  });

  it('translationNamespace="prelaunch.units" resolves the new prelaunch keys for unit labels', () => {
    const target = new Date('2026-01-06T05:09:00Z').getTime();
    render(
      wrap(
        <CountdownTimer targetMs={target} translationNamespace="prelaunch.units" hideComingSoon />,
      ),
    );
    // The prelaunch keys are uppercase "DAYS" / "HOURS" / "MINUTES".
    expect(screen.getByText(viMessages.prelaunch.units.days)).toBeInTheDocument();
    expect(screen.getByText(viMessages.prelaunch.units.hours)).toBeInTheDocument();
    expect(screen.getByText(viMessages.prelaunch.units.minutes)).toBeInTheDocument();
  });

  it('uses prelaunch.units.ariaLabel for the aria-live region when namespaced', () => {
    const target = new Date('2026-01-06T05:09:00Z').getTime();
    const { container } = render(
      wrap(
        <CountdownTimer targetMs={target} translationNamespace="prelaunch.units" hideComingSoon />,
      ),
    );
    expect(container.querySelector('[role="timer"]')).toHaveAttribute(
      'aria-label',
      viMessages.prelaunch.units.ariaLabel,
    );
  });

  it('showPlaceholderOnNull + targetMs=null renders "--" in every tile instead of zeros', () => {
    render(
      wrap(
        <CountdownTimer
          targetMs={null}
          showPlaceholderOnNull
          translationNamespace="prelaunch.units"
          hideComingSoon
        />,
      ),
    );
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '--',
      '--',
      '--',
    ]);
  });

  it('Homepage SAA defaults (no props passed) still render zeros when targetMs is null', () => {
    render(wrap(<CountdownTimer targetMs={null} />));
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '00',
      '00',
      '00',
    ]);
  });
});

describe('<CountdownTimer> — visibility resync (FR-011)', () => {
  it('recomputes remaining time from Date.now() when the tab becomes visible', () => {
    const target = new Date('2026-01-01T00:30:00Z').getTime(); // 30 minutes away
    render(wrap(<CountdownTimer targetMs={target} />));
    expect(screen.getAllByTestId('countdown-value')[2]).toHaveTextContent('30');

    // Simulate the tab being hidden for 10 fake-minutes WITHOUT the interval
    // firing (mimicking a throttled background tab). We advance system time
    // but NOT the timers — then dispatch visibilitychange to force a resync.
    act(() => {
      vi.setSystemTime(new Date('2026-01-01T00:10:00Z'));
      // visibilityState is intentionally NOT toggled — production browsers
      // dispatch visibilitychange on both hide AND show; the component must
      // recompute on every event because it cannot trust setInterval cadence.
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // 30m - 10m elapsed = 20m remaining
    expect(screen.getAllByTestId('countdown-value')[2]).toHaveTextContent('20');
  });
});
