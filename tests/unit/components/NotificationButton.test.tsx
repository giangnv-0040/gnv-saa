import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { NotificationButton } from '@/components/molecules/NotificationButton';
import viMessages from '@/messages/vi.json';

vi.mock('@/lib/notifications/actions', () => ({
  getRecentNotifications: vi.fn(async () => []),
}));

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('<NotificationButton>', () => {
  it('shows the badge when unreadCount > 0', () => {
    render(wrap(<NotificationButton unreadCount={3} />));
    expect(screen.getByTestId('unread-badge')).toBeInTheDocument();
  });

  it('hides the badge when unreadCount is 0', () => {
    render(wrap(<NotificationButton unreadCount={0} />));
    expect(screen.queryByTestId('unread-badge')).toBeNull();
  });

  it('toggles the overlay on click', async () => {
    render(wrap(<NotificationButton unreadCount={0} />));
    const btn = screen.getByRole('button', { name: viMessages.notifications.ariaLabel });
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(btn);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(btn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes the overlay when Escape is pressed', async () => {
    render(wrap(<NotificationButton unreadCount={0} />));
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
