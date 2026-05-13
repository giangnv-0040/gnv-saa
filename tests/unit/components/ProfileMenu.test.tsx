import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ProfileMenu } from '@/components/molecules/ProfileMenu';
import viMessages from '@/messages/vi.json';
import type { UserProfile } from '@/lib/users/types';

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
const adminUser: UserProfile = { ...regularUser, id: 'u-2', role: 'admin' };

describe('<ProfileMenu> — anonymous (FR-019)', () => {
  it('opens an anonymous menu with a single "Sign in" link to /login', async () => {
    render(wrap(<ProfileMenu user={null} />));
    await userEvent.click(screen.getByRole('button', { name: viMessages.profile.menu.ariaLabel }));
    const menu = await screen.findByRole('menu');
    expect(menu).toBeInTheDocument();
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent(viMessages.profile.menu.signIn);
    expect(items[0]).toHaveAttribute('href', '/login');
  });

  it('does NOT render Profile/Sign out/Admin Dashboard items', async () => {
    render(wrap(<ProfileMenu user={null} />));
    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByText(viMessages.profile.menu.profile)).toBeNull();
    expect(screen.queryByText(viMessages.profile.menu.signOut)).toBeNull();
    expect(screen.queryByText(viMessages.profile.menu.adminDashboard)).toBeNull();
  });
});

describe('<ProfileMenu> — regular user (FR-022)', () => {
  it('shows Profile + Sign out, no Admin Dashboard', async () => {
    render(wrap(<ProfileMenu user={regularUser} />));
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByText(viMessages.profile.menu.profile)).toBeInTheDocument();
    expect(screen.getByText(viMessages.profile.menu.signOut)).toBeInTheDocument();
    expect(screen.queryByText(viMessages.profile.menu.adminDashboard)).toBeNull();
  });

  it('Sign out is a form posting to /auth/signout (FR-023)', async () => {
    const { container } = render(wrap(<ProfileMenu user={regularUser} />));
    await userEvent.click(screen.getByRole('button'));
    const form = container.querySelector('form[action="/auth/signout"][method="post"]');
    expect(form).toBeInTheDocument();
    expect(form?.querySelector('button[type="submit"]')).toHaveTextContent(
      viMessages.profile.menu.signOut,
    );
  });

  it('Profile link targets /profile', async () => {
    const { container } = render(wrap(<ProfileMenu user={regularUser} />));
    await userEvent.click(screen.getByRole('button'));
    expect(container.querySelector('a[href="/profile"]')).toBeInTheDocument();
  });
});

describe('<ProfileMenu> — admin user', () => {
  it('adds an Admin Dashboard item linking to /admin', async () => {
    const { container } = render(wrap(<ProfileMenu user={adminUser} />));
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByText(viMessages.profile.menu.adminDashboard)).toBeInTheDocument();
    expect(container.querySelector('a[href="/admin"]')).toBeInTheDocument();
  });
});

describe('<ProfileMenu> — keyboard semantics', () => {
  it('closes on Escape', async () => {
    render(wrap(<ProfileMenu user={null} />));
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
