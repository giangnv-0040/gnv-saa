import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { PrelaunchHero } from '@/components/organisms/prelaunch/PrelaunchHero';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<PrelaunchHero>', () => {
  it('renders the headline as an <h1> with the supplied string', () => {
    render(
      wrap(
        <PrelaunchHero headline={viMessages.prelaunch.heading} targetMs={Date.now() + 60_000} />,
      ),
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(viMessages.prelaunch.heading);
  });

  it('renders the three countdown tiles using prelaunch unit labels', () => {
    render(
      wrap(
        <PrelaunchHero
          headline={viMessages.prelaunch.heading}
          targetMs={new Date('2030-01-01T00:00:00Z').getTime()}
        />,
      ),
    );
    expect(screen.getAllByTestId('countdown-value')).toHaveLength(3);
    expect(screen.getByText(viMessages.prelaunch.units.days)).toBeInTheDocument();
    expect(screen.getByText(viMessages.prelaunch.units.hours)).toBeInTheDocument();
    expect(screen.getByText(viMessages.prelaunch.units.minutes)).toBeInTheDocument();
  });

  it('renders -- placeholders in every tile when targetMs is null (FR-009)', () => {
    render(wrap(<PrelaunchHero headline={viMessages.prelaunch.heading} targetMs={null} />));
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '--',
      '--',
      '--',
    ]);
  });

  it('mounts the decorative background image', () => {
    const { container } = render(
      wrap(<PrelaunchHero headline={viMessages.prelaunch.heading} targetMs={null} />),
    );
    expect(container.querySelector('img[data-testid="prelaunch-bg"]')).toBeInTheDocument();
  });
});
