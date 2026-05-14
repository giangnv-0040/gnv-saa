import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AwardsPageTitle } from '@/components/organisms/awards/AwardsPageTitle';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<AwardsPageTitle>', () => {
  it('renders the localized caption + main heading', () => {
    render(wrap(<AwardsPageTitle />));
    expect(screen.getByText(viMessages.awardsPage.pageCaption)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: viMessages.awardsPage.pageTitle }),
    ).toBeInTheDocument();
  });

  it('main heading is the page <h1>', () => {
    const { container } = render(wrap(<AwardsPageTitle />));
    expect(container.querySelector('h1')).toBeInTheDocument();
  });
});
