'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getQueryClient } from '@/lib/query/client';

/**
 * Client-side wrapper that exposes the TanStack Query cache to the React
 * tree. Imported by `app/layout.tsx` so every page can use `useQuery` /
 * `useMutation`.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
