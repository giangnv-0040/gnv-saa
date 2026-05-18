import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { PrelaunchTimer } from '@/components/organisms/prelaunch/PrelaunchTimer';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<PrelaunchTimer>', () => {
  it('forwards targetMs to <CountdownTimer> with prelaunch namespace + hideComingSoon', () => {
    const target = new Date('2026-12-31T18:30:00+07:00').getTime();
    render(wrap(<PrelaunchTimer targetMs={target} />));
    expect(screen.getAllByTestId('countdown-value')).toHaveLength(3);
    // "Coming soon" sub-label must NOT appear — hideComingSoon is set.
    expect(screen.queryByText(viMessages.homepage.hero.comingSoon)).toBeNull();
    // Unit labels come from prelaunch.units.
    expect(screen.getByText(viMessages.prelaunch.units.days)).toBeInTheDocument();
  });

  it('renders -- placeholders when targetMs is null (showPlaceholderOnNull is implicit)', () => {
    render(wrap(<PrelaunchTimer targetMs={null} />));
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '--',
      '--',
      '--',
    ]);
  });
});
