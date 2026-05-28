import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import viMessages from '@/messages/vi.json';

/**
 * Render helper for the live-board components that need both
 * `next-intl` messages and a TanStack QueryClient (e.g. HeartButton,
 * KudosSidebar, AllKudosFeed).
 */
export function wrapKudos(ui: ReactNode, opts: { queryClient?: QueryClient } = {}) {
  const client =
    opts.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}
