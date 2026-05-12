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

describe('<AppFooter>', () => {
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
