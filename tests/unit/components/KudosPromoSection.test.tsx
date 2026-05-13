import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { KudosPromoSection } from '@/components/organisms/homepage/KudosPromoSection';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<KudosPromoSection>', () => {
  it('renders the localized label, title, and description', () => {
    render(wrap(<KudosPromoSection />));
    expect(screen.getByText(viMessages.homepage.kudos.label)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: viMessages.homepage.kudos.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(viMessages.homepage.kudos.description)).toBeInTheDocument();
  });

  it('renders a "Chi tiết" CTA targeting /kudos (FR-016)', () => {
    const { container } = render(wrap(<KudosPromoSection />));
    const link = container.querySelector('a[href="/kudos"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent(viMessages.homepage.kudos.detailLink);
  });

  it('uses an aria-labelledby section', () => {
    const { container } = render(wrap(<KudosPromoSection />));
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'kudos-promo-heading');
  });
});
