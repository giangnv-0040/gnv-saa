import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { QuickActionWidget } from '@/components/organisms/homepage/QuickActionWidget';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<QuickActionWidget>', () => {
  it('renders the trigger button with an aria-label', () => {
    render(wrap(<QuickActionWidget />));
    expect(
      screen.getByRole('button', { name: viMessages.homepage.widget.ariaLabel }),
    ).toBeInTheDocument();
  });

  it('overlay is hidden by default', () => {
    render(wrap(<QuickActionWidget />));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens the overlay on click with exactly 2 items in order: Viết Kudo, Thể lệ SAA', async () => {
    render(wrap(<QuickActionWidget />));
    await userEvent.click(screen.getByRole('button'));
    const items = await screen.findAllByRole('menuitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(viMessages.homepage.widget.viewKudo);
    expect(items[1]).toHaveTextContent(viMessages.homepage.widget.rules);
  });

  it('routes Viết Kudo → /kudos/new and Thể lệ SAA → /rules (FR-018)', async () => {
    const { container } = render(wrap(<QuickActionWidget />));
    await userEvent.click(screen.getByRole('button'));
    expect(container.querySelector('a[href="/kudos/new"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/rules"]')).toBeInTheDocument();
  });

  it('closes the overlay on Escape (US5 #3)', async () => {
    render(wrap(<QuickActionWidget />));
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
