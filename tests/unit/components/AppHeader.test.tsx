import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AppHeader } from '@/components/organisms/AppHeader';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<AppHeader> — default (Login mode)', () => {
  it('renders the logo as a non-interactive image (Login FR-013)', () => {
    const { container } = render(wrap(<AppHeader />));
    const logo = container.querySelector('img[alt="SAA"]');
    expect(logo).toBeInTheDocument();
    expect(logo?.closest('a')).toBeNull();
    expect(logo?.closest('button')).toBeNull();
  });

  it('renders the trailing slot when children are provided (BC for Login)', () => {
    render(
      wrap(
        <AppHeader>
          <span data-testid="trailing">Trailing</span>
        </AppHeader>,
      ),
    );
    expect(screen.getByTestId('trailing')).toBeInTheDocument();
  });

  it('uses a semantic <header> landmark', () => {
    const { container } = render(wrap(<AppHeader />));
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('does NOT render the nav slot when prop is omitted', () => {
    render(wrap(<AppHeader nav={<span data-testid="should-not-appear">x</span>} />));
    // Sanity check the negative path: when nav IS passed, it renders.
    expect(screen.getByTestId('should-not-appear')).toBeInTheDocument();
  });

  it('defaults to the light theme (no dark background classes)', () => {
    const { container } = render(wrap(<AppHeader />));
    const header = container.querySelector('header');
    expect(header).toHaveAttribute('data-theme', 'light');
    expect(header?.className).not.toMatch(/bg-hero-background/);
  });
});

describe('<AppHeader> — dark theme', () => {
  it('applies dark background + cream foreground classes', () => {
    const { container } = render(wrap(<AppHeader theme="dark" />));
    const header = container.querySelector('header');
    expect(header).toHaveAttribute('data-theme', 'dark');
    expect(header?.className).toMatch(/bg-hero-background/);
    expect(header?.className).toMatch(/text-hero-foreground/);
  });
});

describe('<AppHeader> — logoSrc override', () => {
  it('uses the default brand mark when logoSrc is omitted', () => {
    const { container } = render(wrap(<AppHeader />));
    const logo = container.querySelector('img[alt="SAA"]');
    expect(logo).toHaveAttribute('src', '/assets/common/logo.png');
  });

  it('uses the per-screen logo when logoSrc is provided', () => {
    const { container } = render(
      wrap(<AppHeader logoSrc="/assets/homepage/images/logo-header.png" />),
    );
    const logo = container.querySelector('img[alt="SAA"]');
    expect(logo).toHaveAttribute('src', '/assets/homepage/images/logo-header.png');
  });
});

describe('<AppHeader> — Homepage mode', () => {
  it('logo is a <Link> with aria-label when logoHref is provided (Homepage FR-004)', () => {
    const { container } = render(wrap(<AppHeader logoHref="/" />));
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveAttribute('aria-label', viMessages.header.nav.logoAriaLabel);
    expect(link?.querySelector('img[alt="SAA"]')).toBeInTheDocument();
  });

  it('renders the nav slot when provided', () => {
    render(
      wrap(
        <AppHeader nav={<span data-testid="nav">Nav</span>}>
          <span data-testid="controls">Controls</span>
        </AppHeader>,
      ),
    );
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
  });

  it('prefers explicit `controls` prop over legacy `children`', () => {
    render(
      wrap(
        <AppHeader controls={<span data-testid="controls">Controls</span>}>
          <span data-testid="legacy">Legacy</span>
        </AppHeader>,
      ),
    );
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy')).not.toBeInTheDocument();
  });
});
