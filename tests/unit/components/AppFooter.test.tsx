import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AppFooter } from '@/components/organisms/AppFooter';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<AppFooter> — default (Login variant)', () => {
  it('renders a <footer role="contentinfo">', () => {
    const { container } = render(wrap(<AppFooter />));
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveAttribute('role', 'contentinfo');
  });

  it('contains the localized copyright string', () => {
    const { getByText } = render(wrap(<AppFooter />));
    expect(getByText(viMessages.footer.copyright)).toBeInTheDocument();
  });

  it('has no interactive descendants (FR-013)', () => {
    const { container } = render(wrap(<AppFooter />));
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });

  it('uses mt-auto for sticky-bottom layout (FR-014)', () => {
    const { container } = render(wrap(<AppFooter />));
    const footer = container.querySelector('footer');
    expect(footer?.className).toContain('mt-auto');
  });
});

describe('<AppFooter> — homepage variant', () => {
  it('renders logo as a link to /', () => {
    const { container } = render(wrap(<AppFooter variant="homepage" />));
    const logoLink = container.querySelector('a[href="/"]');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink?.querySelector('img[alt="SAA"]')).toBeInTheDocument();
  });

  it('renders 4 footer nav links (About / Awards / Kudos / Community standards)', () => {
    const { getByText } = render(wrap(<AppFooter variant="homepage" />));
    expect(getByText(viMessages.footer.nav.about)).toBeInTheDocument();
    expect(getByText(viMessages.footer.nav.awards)).toBeInTheDocument();
    expect(getByText(viMessages.footer.nav.kudos)).toBeInTheDocument();
    expect(getByText(viMessages.footer.nav.communityStandards)).toBeInTheDocument();
  });

  it('targets the correct routes (derived from lib/routes.ts)', () => {
    const { container } = render(wrap(<AppFooter variant="homepage" />));
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining(['/', '/awards', '/kudos', '/community-standards']),
    );
  });

  it('contains the localized copyright string', () => {
    const { getByText } = render(wrap(<AppFooter variant="homepage" />));
    expect(getByText(viMessages.footer.copyright)).toBeInTheDocument();
  });

  it('keeps mt-auto on the homepage variant too (FR-014)', () => {
    const { container } = render(wrap(<AppFooter variant="homepage" />));
    expect(container.querySelector('footer')?.className).toContain('mt-auto');
  });
});
