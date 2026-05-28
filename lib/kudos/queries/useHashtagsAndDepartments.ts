'use client';

import { useQuery } from '@tanstack/react-query';
import type { KudoFilterOption } from '../types';

const filterOptionsQueryKey = (kind: 'hashtags' | 'departments') =>
  ['kudos', 'filters', kind] as const;

/**
 * Hashtag + department filter values for the HIGHLIGHT KUDOS dropdowns.
 * TR-008: cached for the lifetime of the session (`staleTime: Infinity`).
 */
export function useHashtagOptions(initial?: readonly KudoFilterOption[]) {
  return useQuery<readonly KudoFilterOption[]>({
    queryKey: filterOptionsQueryKey('hashtags'),
    queryFn: async () => {
      const res = await fetch('/api/kudos/hashtags');
      if (!res.ok) throw new Error(`hashtags fetch failed: ${res.status}`);
      const json = (await res.json()) as { items: KudoFilterOption[] };
      return json.items;
    },
    staleTime: Number.POSITIVE_INFINITY,
    initialData: initial,
  });
}

export function useDepartmentOptions(initial?: readonly KudoFilterOption[]) {
  return useQuery<readonly KudoFilterOption[]>({
    queryKey: filterOptionsQueryKey('departments'),
    queryFn: async () => {
      const res = await fetch('/api/kudos/departments');
      if (!res.ok) throw new Error(`departments fetch failed: ${res.status}`);
      const json = (await res.json()) as { items: KudoFilterOption[] };
      return json.items;
    },
    staleTime: Number.POSITIVE_INFINITY,
    initialData: initial,
  });
}
