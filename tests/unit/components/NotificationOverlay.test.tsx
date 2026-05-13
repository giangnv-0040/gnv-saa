import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { NotificationOverlay } from '@/components/molecules/NotificationOverlay';
import viMessages from '@/messages/vi.json';

const getRecent = vi.fn();
vi.mock('@/lib/notifications/actions', () => ({
  getRecentNotifications: (...args: unknown[]) => getRecent(...args),
}));

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  getRecent.mockReset();
});

describe('<NotificationOverlay>', () => {
  it('renders the empty-state copy when the service returns []', async () => {
    getRecent.mockResolvedValueOnce([]);
    render(wrap(<NotificationOverlay id="x" onClose={() => {}} />));
    await waitFor(() =>
      expect(screen.getByText(viMessages.notifications.emptyState)).toBeInTheDocument(),
    );
  });

  it('renders notification items when the service returns data', async () => {
    getRecent.mockResolvedValueOnce([
      { id: '1', title: 'Hi', body: 'Hello', createdAt: '2026-01-01', read: false, url: null },
    ]);
    render(wrap(<NotificationOverlay id="x" onClose={() => {}} />));
    await waitFor(() => expect(screen.getByText('Hi')).toBeInTheDocument());
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders a "See all" link to /notifications', () => {
    getRecent.mockResolvedValueOnce([]);
    const { container } = render(wrap(<NotificationOverlay id="x" onClose={() => {}} />));
    const link = container.querySelector('a[href="/notifications"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent(viMessages.notifications.seeAll);
  });

  it('calls the requested limit (5) on mount', () => {
    getRecent.mockResolvedValueOnce([]);
    render(wrap(<NotificationOverlay id="x" onClose={() => {}} />));
    expect(getRecent).toHaveBeenCalledWith({ limit: 5 });
  });
});
