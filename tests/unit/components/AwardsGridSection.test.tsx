import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AwardsGridSection } from '@/components/organisms/homepage/AwardsGridSection';
import viMessages from '@/messages/vi.json';
import { awards } from '@/lib/awards/config';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<AwardsGridSection>', () => {
  it('renders the localized section header (caption + title + subtitle)', () => {
    render(wrap(<AwardsGridSection />));
    expect(screen.getByText(viMessages.homepage.awards.section.caption)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: viMessages.homepage.awards.section.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(viMessages.homepage.awards.section.subtitle)).toBeInTheDocument();
  });

  it('renders all 6 award cards in catalogue order (FR-011)', () => {
    const { container } = render(wrap(<AwardsGridSection />));
    const links = Array.from(container.querySelectorAll('a'));
    expect(links).toHaveLength(awards.length);
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([
      '/awards#top-talent',
      '/awards#top-project',
      '/awards#top-project-leader',
      '/awards#best-manager',
      '/awards#signature-2025-creator',
      '/awards#mvp',
    ]);
  });

  it('uses a <section> with an aria-labelledby header', () => {
    const { container } = render(wrap(<AwardsGridSection />));
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'awards-overview-heading');
  });
});
