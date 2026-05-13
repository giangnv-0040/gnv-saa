import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { HeaderNav } from '@/components/molecules/HeaderNav';
import viMessages from '@/messages/vi.json';

const pathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => pathname(),
}));

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<HeaderNav>', () => {
  it('renders 3 nav links with the localized labels', () => {
    pathname.mockReturnValue('/');
    render(wrap(<HeaderNav />));
    expect(screen.getByRole('link', { name: viMessages.header.nav.about })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: viMessages.header.nav.awards })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: viMessages.header.nav.kudos })).toBeInTheDocument();
  });

  it('targets the correct routes', () => {
    pathname.mockReturnValue('/');
    render(wrap(<HeaderNav />));
    expect(screen.getByRole('link', { name: viMessages.header.nav.about })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: viMessages.header.nav.awards })).toHaveAttribute(
      'href',
      '/awards',
    );
    expect(screen.getByRole('link', { name: viMessages.header.nav.kudos })).toHaveAttribute(
      'href',
      '/kudos',
    );
  });

  it('marks "About SAA 2025" as the active link on / (FR-002)', () => {
    pathname.mockReturnValue('/');
    render(wrap(<HeaderNav />));
    expect(screen.getByRole('link', { name: viMessages.header.nav.about })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('does NOT mark "About SAA 2025" as active on a non-/ route (exact match)', () => {
    pathname.mockReturnValue('/awards');
    render(wrap(<HeaderNav />));
    expect(screen.getByRole('link', { name: viMessages.header.nav.about })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: viMessages.header.nav.awards })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('uses a <nav> landmark with aria-label="Primary"', () => {
    pathname.mockReturnValue('/');
    const { container } = render(wrap(<HeaderNav />));
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Primary');
  });
});
