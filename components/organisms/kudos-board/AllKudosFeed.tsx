'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { KudoCard } from '@/components/molecules/kudos-board/KudoCard';
import { useKudosFeed, type FeedPage } from '@/lib/kudos/queries/useKudosFeed';

interface AllKudosFeedProps {
  /** Server-rendered first page so the read path is one round-trip (TR-009). */
  initial?: FeedPage;
  viewerId?: string | null;
}

/**
 * ALL KUDOS feed — cursor-paginated chronological list (newest first).
 * Hydrates from the server-supplied first page, then uses TanStack
 * `useInfiniteQuery` + IntersectionObserver to load subsequent pages
 * (US6 / FR-003 / TR-007).
 */
export function AllKudosFeed({ initial, viewerId = null }: AllKudosFeedProps) {
  const t = useTranslations('kudos.live.feed');
  const params = useSearchParams();
  const hashtag = params.get('hashtag');
  const team = params.get('team');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useKudosFeed({
    hashtag,
    team,
    initial: hashtag || team ? undefined : initial,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '160px 0px 0px 0px', threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  return (
    <section className="min-w-0 flex-1">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-hero-foreground/70">{t('eyebrow')}</p>
          <h2 className="text-3xl font-extrabold uppercase tracking-wider text-[#FFEA9E] md:text-4xl">
            {t('title')}
          </h2>
        </div>
        {hashtag || team ? <ActiveFilterBadge hashtag={hashtag} team={team} /> : null}
      </header>

      {items.length === 0 && !isLoading ? (
        <p className="rounded-lg border border-dashed border-hero-foreground/30 py-12 text-center text-sm text-hero-foreground/60">
          {t('empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {items.map((kudo) => (
            <KudoCard key={kudo.id} kudo={kudo} variant="feed" viewerId={viewerId} />
          ))}
          <div ref={sentinelRef} aria-hidden className="h-1" />
          {isFetchingNextPage ? (
            <p className="text-center text-xs text-hero-foreground/60">{t('loadingMore')}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ActiveFilterBadge({ hashtag, team }: { hashtag: string | null; team: string | null }) {
  const t = useTranslations('kudos.live.feed.activeFilter');
  return (
    <div className="flex flex-wrap items-center gap-2">
      {hashtag ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-[#FFEA9E]/30 bg-[#FFEA9E]/10 px-3 py-1 text-xs font-semibold text-[#FFEA9E]">
          {t('hashtag', { value: `#${hashtag}` })}
          <Link
            href="/kudos"
            aria-label={t('clearAriaLabel')}
            className="text-[#FFEA9E] hover:underline"
          >
            ×
          </Link>
        </span>
      ) : null}
      {team ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-[#FFEA9E]/30 bg-[#FFEA9E]/10 px-3 py-1 text-xs font-semibold text-[#FFEA9E]">
          {t('team', { value: team })}
          <Link
            href="/kudos"
            aria-label={t('clearAriaLabel')}
            className="text-[#FFEA9E] hover:underline"
          >
            ×
          </Link>
        </span>
      ) : null}
    </div>
  );
}
