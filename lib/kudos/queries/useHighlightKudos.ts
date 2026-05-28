'use client';

import { useQuery } from '@tanstack/react-query';
import type { Kudo } from '../types';

interface UseHighlightOptions {
  hashtag?: string | null;
  team?: string | null;
  initial?: readonly Kudo[];
  limit?: number;
}

export const highlightQueryKey = (hashtag: string | null, team: string | null) =>
  ['kudos', 'highlight', { hashtag, team }] as const;

/** HIGHLIGHT KUDOS — top-N (default 5) sorted by hearts (US1, US4, US5). */
export function useHighlightKudos({
  hashtag = null,
  team = null,
  initial,
  limit = 5,
}: UseHighlightOptions = {}) {
  return useQuery<readonly Kudo[]>({
    queryKey: highlightQueryKey(hashtag, team),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('sort', 'hearts');
      params.set('limit', String(limit));
      if (hashtag) params.set('hashtag', hashtag);
      if (team) params.set('team', team);
      const res = await fetch(`/api/kudos?${params.toString()}`);
      if (!res.ok) throw new Error(`Highlight fetch failed: ${res.status}`);
      const json = (await res.json()) as { items: Kudo[] };
      return json.items;
    },
    initialData: initial,
  });
}
