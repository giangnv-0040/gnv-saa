import { QueryClient } from '@tanstack/react-query';

/**
 * Browser-side QueryClient singleton.
 *
 * `staleTime` defaults match the live-board read model — feed/highlight
 * refetch on focus to stay live, hashtag/department filter lookups stay
 * cached for the session (TR-008).
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

/**
 * Returns the request-scoped QueryClient on the server (one per request) and
 * the singleton on the browser, following the TanStack Query App Router
 * guidance.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}
