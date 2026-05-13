import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { HeroSection } from '@/components/organisms/homepage/HeroSection';
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
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('<HeroSection>', () => {
  it('renders the ROOT/FURTHER logotypes with correct alt-text on the primary one', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-06-01T00:00:00Z');
    render(wrap(<HeroSection />));
    expect(screen.getByAltText(viMessages.homepage.hero.rootFurtherAlt)).toBeInTheDocument();
  });

  it('renders the countdown tiles (3 of them)', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-06-01T00:00:00Z');
    render(wrap(<HeroSection />));
    expect(screen.getAllByTestId('countdown-value')).toHaveLength(3);
  });

  it('renders the event info (time, venue, broadcast)', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-06-01T00:00:00Z');
    render(wrap(<HeroSection />));
    expect(screen.getByText(viMessages.homepage.event.timeLabel)).toBeInTheDocument();
    expect(screen.getByText(viMessages.homepage.event.time)).toBeInTheDocument();
    expect(screen.getByText(viMessages.homepage.event.venueLabel)).toBeInTheDocument();
    expect(screen.getByText(viMessages.homepage.event.venue)).toBeInTheDocument();
    expect(screen.getByText(viMessages.homepage.event.broadcast)).toBeInTheDocument();
  });

  it('renders the two CTAs with correct routes (FR-010)', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-06-01T00:00:00Z');
    const { container } = render(wrap(<HeroSection />));
    const aboutAwards = container.querySelector('a[href="/awards"]');
    const aboutKudos = container.querySelector('a[href="/kudos"]');
    expect(aboutAwards).toBeInTheDocument();
    expect(aboutKudos).toBeInTheDocument();
    expect(aboutAwards).toHaveTextContent(viMessages.homepage.cta.aboutAwards);
    expect(aboutKudos).toHaveTextContent(viMessages.homepage.cta.aboutKudos);
  });

  it('renders the Root Further description paragraphs', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2026-06-01T00:00:00Z');
    render(wrap(<HeroSection />));
    // The paragraphs are long; check the first sentence is present.
    expect(
      screen.getByText(/Đứng trước bối cảnh thay đổi như vũ bão của thời đại AI/),
    ).toBeInTheDocument();
    expect(screen.getByText(/“A tree with deep roots fears no storm”/)).toBeInTheDocument();
  });

  it('falls back to 00 00 00 when env var is missing (FR-009)', () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '');
    render(wrap(<HeroSection />));
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '00',
      '00',
      '00',
    ]);
    expect(screen.queryByText(viMessages.homepage.hero.comingSoon)).toBeNull();
  });
});
