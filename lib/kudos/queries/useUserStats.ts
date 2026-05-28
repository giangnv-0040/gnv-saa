'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserKudoStats } from '../types';

export const userStatsQueryKey = ['users', 'me', 'stats'] as const;

/** Personal counters for the live-board sidebar (US8). Anonymous → null. */
export function useUserStats(initial?: UserKudoStats | null) {
  return useQuery<UserKudoStats | null>({
    queryKey: userStatsQueryKey,
    queryFn: async () => {
      const res = await fetch('/api/users/me/stats');
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`stats fetch failed: ${res.status}`);
      const json = (await res.json()) as { stats: UserKudoStats };
      return json.stats;
    },
    initialData: initial ?? undefined,
  });
}
