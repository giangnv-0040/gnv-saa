import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { HomepageHeader } from '@/components/organisms/homepage/HomepageHeader';
import viMessages from '@/messages/vi.json';
import type { UserProfile } from '@/lib/users/types';

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

const regularUser: UserProfile = {
  id: 'u-1',
  email: 'alice@sun-asterisk.com',
  displayName: 'Alice',
  avatarUrl: null,
  locale: 'vi',
  role: 'user',
};

describe('<HomepageHeader> — anonymous', () => {
  it('renders logo as a link to /', () => {
    const { container } = render(wrap(<HomepageHeader user={null} unreadCount={0} locale="vi" />));
    expect(container.querySelector('a[href="/"]')).toBeInTheDocument();
  });

  it('renders the LanguageSwitcher trigger', () => {
    render(wrap(<HomepageHeader user={null} unreadCount={0} locale="vi" />));
    expect(
      screen.getByRole('button', { name: viMessages.language.switcher.ariaLabel }),
    ).toBeInTheDocument();
  });

  it('hides the bell entirely for anonymous visitors (FR-019)', () => {
    render(wrap(<HomepageHeader user={null} unreadCount={0} locale="vi" />));
    expect(screen.queryByRole('button', { name: viMessages.notifications.ariaLabel })).toBeNull();
  });

  it('renders the ProfileMenu trigger even when anonymous', () => {
    render(wrap(<HomepageHeader user={null} unreadCount={0} locale="vi" />));
    expect(
      screen.getByRole('button', { name: viMessages.profile.menu.ariaLabel }),
    ).toBeInTheDocument();
  });
});

describe('<HomepageHeader> — authenticated', () => {
  it('shows the bell when user is present', () => {
    render(wrap(<HomepageHeader user={regularUser} unreadCount={0} locale="vi" />));
    expect(
      screen.getByRole('button', { name: viMessages.notifications.ariaLabel }),
    ).toBeInTheDocument();
  });

  it('shows the unread badge when count > 0', () => {
    render(wrap(<HomepageHeader user={regularUser} unreadCount={2} locale="vi" />));
    expect(screen.getByTestId('unread-badge')).toBeInTheDocument();
  });

  it('does not render the badge when count is 0', () => {
    render(wrap(<HomepageHeader user={regularUser} unreadCount={0} locale="vi" />));
    expect(screen.queryByTestId('unread-badge')).toBeNull();
  });
});
