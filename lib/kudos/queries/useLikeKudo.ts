'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Kudo } from '../types';
import { kudosFeedQueryKey } from './useKudosFeed';
import { highlightQueryKey } from './useHighlightKudos';

interface LikeMutationInput {
  kudoId: string;
  /** Next desired state — true to like, false to unlike. */
  liked: boolean;
}

interface FeedPage {
  items: Kudo[];
  nextCursor: string | null;
}

interface FeedInfiniteData {
  pages: FeedPage[];
  pageParams: (string | null)[];
}

interface OptimisticContext {
  previousFeed: Map<readonly unknown[], FeedInfiniteData | undefined>;
  previousHighlight: Map<readonly unknown[], readonly Kudo[] | undefined>;
}

/**
 * Optimistic like/unlike. Flips the heart locally + adjusts the count, then
 * sends POST/DELETE /api/kudos/[id]/like. On error, rolls back via the
 * snapshot captured in `onMutate`.
 */
export function useLikeKudo() {
  const queryClient = useQueryClient();

  return useMutation<{ heartsCount: number }, Error, LikeMutationInput, OptimisticContext>({
    mutationFn: async ({ kudoId, liked }) => {
      const res = await fetch(`/api/kudos/${encodeURIComponent(kudoId)}/like`, {
        method: liked ? 'POST' : 'DELETE',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`like request failed (${res.status}): ${text}`);
      }
      return (await res.json()) as { heartsCount: number };
    },
    onMutate: async ({ kudoId, liked }) => {
      await queryClient.cancelQueries({ queryKey: ['kudos'] });

      const previousFeed = new Map<readonly unknown[], FeedInfiniteData | undefined>();
      const previousHighlight = new Map<readonly unknown[], readonly Kudo[] | undefined>();

      // Patch every cached feed page that contains the kudo.
      const feedQueries = queryClient.getQueriesData<FeedInfiniteData>({
        queryKey: ['kudos', 'feed'],
      });
      for (const [key, data] of feedQueries) {
        previousFeed.set(key, data);
        if (!data) continue;
        const next: FeedInfiniteData = {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((k) => (k.id === kudoId ? applyLike(k, liked) : k)),
          })),
        };
        queryClient.setQueryData(key, next);
      }

      // Patch every highlight cache.
      const highlightQueries = queryClient.getQueriesData<readonly Kudo[]>({
        queryKey: ['kudos', 'highlight'],
      });
      for (const [key, data] of highlightQueries) {
        previousHighlight.set(key, data);
        if (!data) continue;
        const next = data.map((k) => (k.id === kudoId ? applyLike(k, liked) : k));
        queryClient.setQueryData(key, next);
      }

      return { previousFeed, previousHighlight };
    },
    onError: (_err, _input, ctx) => {
      if (!ctx) return;
      for (const [key, value] of ctx.previousFeed) {
        queryClient.setQueryData(key, value);
      }
      for (const [key, value] of ctx.previousHighlight) {
        queryClient.setQueryData(key, value);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kudos'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'stats'] });
    },
  });
}

function applyLike(kudo: Kudo, liked: boolean): Kudo {
  if (kudo.viewerHasLiked === liked) return kudo;
  return {
    ...kudo,
    viewerHasLiked: liked,
    heartsCount: Math.max(0, kudo.heartsCount + (liked ? 1 : -1)),
  };
}

// re-export for tests / debug.
export { kudosFeedQueryKey, highlightQueryKey };
