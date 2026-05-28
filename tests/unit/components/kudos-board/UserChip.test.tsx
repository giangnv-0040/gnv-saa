import { describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { UserChip } from '@/components/molecules/kudos-board/UserChip';
import viMessages from '@/messages/vi.json';
import type { KudoUserSummary } from '@/lib/kudos/types';

const USER: KudoUserSummary = {
  id: 'u-1',
  displayName: 'Test User',
  team: 'TeamA',
  badge: 'Rising Hero',
  heartsReceived: 24,
  avatarUrl: null,
};

function wrap(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {node}
    </NextIntlClientProvider>
  );
}

describe('<UserChip>', () => {
  it('links the chip to /profile/{userId}', () => {
    render(wrap(<UserChip user={USER} />));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/profile/${USER.id}`);
  });

  it('opens a popover ≥300ms after hover and closes on unhover', async () => {
    const user = userEvent.setup();
    render(wrap(<UserChip user={USER} />));
    const link = screen.getByRole('link');
    const span = link.parentElement!;

    expect(screen.queryByRole('tooltip')).toBeNull();

    await user.hover(span);
    await act(() => new Promise((r) => setTimeout(r, 320)));

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Test User');
    expect(tooltip).toHaveTextContent('24 tim đã nhận');
    expect(tooltip).toHaveTextContent('Rising Hero');

    await user.unhover(span);
    await act(() => new Promise((r) => setTimeout(r, 200)));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
