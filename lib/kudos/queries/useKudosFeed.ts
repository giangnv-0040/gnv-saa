'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type { Kudo } from '../types';

export interface FeedPage {
  items: readonly Kudo[];
  nextCursor: string | null;
}

interface UseKudosFeedOptions {
  hashtag?: string | null;
  team?: string | null;
  initial?: FeedPage;
  limit?: number;
}

export const kudosFeedQueryKey = (hashtag: string | null, team: string | null) =>
  ['kudos', 'feed', { hashtag, team }] as const;

/**
 * Cursor-paginated feed for ALL KUDOS (FR-003, US6). Wraps
 * `useInfiniteQuery` so the IntersectionObserver in `AllKudosFeed` can call
 * `fetchNextPage` to append the next batch.
 */
export function useKudosFeed({
  hashtag = null,
  team = null,
  initial,
  limit = 10,
}: UseKudosFeedOptions = {}) {
  return useInfiniteQuery({
    queryKey: kudosFeedQueryKey(hashtag, team),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('sort', 'newest');
      params.set('limit', String(limit));
      if (pageParam) params.set('cursor', pageParam);
      if (hashtag) params.set('hashtag', hashtag);
      if (team) params.set('team', team);
      const res = await fetch(`/api/kudos?${params.toString()}`);
      if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
      return (await res.json()) as FeedPage;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData: initial ? { pages: [initial], pageParams: [null as string | null] } : undefined,
  });
}
