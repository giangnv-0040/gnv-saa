import { getLocale } from 'next-intl/server';
import { AppFooter } from '@/components/organisms/AppFooter';
import { HomepageHeader } from '@/components/organisms/homepage/HomepageHeader';
import { AllKudosFeed } from '@/components/organisms/kudos-board/AllKudosFeed';
import { HighlightCarousel } from '@/components/organisms/kudos-board/HighlightCarousel';
import { KudoBannerHero } from '@/components/organisms/kudos-board/KudoBannerHero';
import { KudosSidebar } from '@/components/organisms/kudos-board/KudosSidebar';
import { QuickCaptureBar } from '@/components/organisms/kudos-board/QuickCaptureBar';
import { SpotlightBoard } from '@/components/organisms/kudos-board/SpotlightBoard';
import {
  fetchDepartments,
  fetchFeed,
  fetchHashtags,
  fetchHighlight,
  fetchSpotlight,
} from '@/lib/kudos/server/feed';
import { fetchLeaderboard, fetchMyStats } from '@/lib/kudos/server/stats';
import { LIVE_BOARD_MOCK } from '@/lib/kudos/mock';
import { defaultLocale, isLocale } from '@/lib/i18n/config';
import { logger } from '@/lib/logger';
import { getUnreadCount } from '@/lib/notifications/actions';
import { getCurrentUserProfile } from '@/lib/users/actions';

// Always render fresh: the live board is the canonical "what's happening
// right now" view (TR-009).
export const dynamic = 'force-dynamic';

/**
 * Sun* Kudos - Live board (frame `MaZUn5xHXZ`).
 *
 * Server-renders the first paint of each region from `lib/kudos/server/*`
 * and hands the data to the client components as `initial`. Client uses
 * TanStack Query to refetch after mutations / filter changes / scroll.
 *
 * If a database read fails (e.g. local dev without Supabase running) the
 * page falls back to `LIVE_BOARD_MOCK` so the visual review path keeps
 * working — production hits the DB and will surface real errors.
 */
export default async function KudosLiveBoardPage() {
  const [user, unreadCount, rawLocale] = await Promise.all([
    getCurrentUserProfile(),
    getUnreadCount(),
    getLocale(),
  ]);

  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const data = await loadLiveBoardData(Boolean(user));

  return (
    <div className="flex min-h-screen flex-col bg-hero-background text-hero-foreground">
      <HomepageHeader user={user} unreadCount={unreadCount} locale={locale} />

      <main className="flex-1">
        <KudoBannerHero />
        <QuickCaptureBar />

        <HighlightCarousel
          initial={data.highlight}
          hashtagOptions={data.hashtags}
          departmentOptions={data.departments}
          viewerId={user?.id ?? null}
        />

        <SpotlightBoard recipients={data.spotlight} total={data.spotlightTotal} />

        <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <AllKudosFeed initial={data.feed} viewerId={user?.id ?? null} />
            <KudosSidebar
              stats={user ? data.stats : null}
              giftLeaderboard={data.giftLeaderboard}
              rankLeaderboard={data.rankLeaderboard}
            />
          </div>
        </section>
      </main>

      <AppFooter variant="homepage" />
    </div>
  );
}

interface LiveBoardData {
  highlight: Awaited<ReturnType<typeof fetchHighlight>>;
  feed: Awaited<ReturnType<typeof fetchFeed>>;
  hashtags: Awaited<ReturnType<typeof fetchHashtags>>;
  departments: Awaited<ReturnType<typeof fetchDepartments>>;
  spotlight: Awaited<ReturnType<typeof fetchSpotlight>>['recipients'];
  spotlightTotal: number;
  stats: Awaited<ReturnType<typeof fetchMyStats>>;
  giftLeaderboard: Awaited<ReturnType<typeof fetchLeaderboard>>;
  rankLeaderboard: Awaited<ReturnType<typeof fetchLeaderboard>>;
}

async function loadLiveBoardData(isAuthenticated: boolean): Promise<LiveBoardData> {
  try {
    const [highlight, feed, hashtags, departments, spotlight, giftLb, rankLb, stats] =
      await Promise.all([
        fetchHighlight({ limit: 5, hashtag: null, team: null }),
        fetchFeed({ sort: 'newest', limit: 10, cursor: null, hashtag: null, team: null }),
        fetchHashtags(),
        fetchDepartments(),
        fetchSpotlight(),
        fetchLeaderboard('gift-received', 10),
        fetchLeaderboard('rank-promotion', 10),
        isAuthenticated ? fetchMyStats() : Promise.resolve(null),
      ]);

    return {
      highlight,
      feed: { items: [...feed.items], nextCursor: feed.nextCursor },
      hashtags,
      departments,
      spotlight: spotlight.recipients,
      spotlightTotal: spotlight.total,
      stats,
      giftLeaderboard: giftLb,
      rankLeaderboard: rankLb,
    };
  } catch (error) {
    logger.warn('kudos.live_board.fallback_to_mock', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      highlight: LIVE_BOARD_MOCK.highlight,
      feed: { items: [...LIVE_BOARD_MOCK.feed], nextCursor: null },
      hashtags: LIVE_BOARD_MOCK.hashtags,
      departments: LIVE_BOARD_MOCK.departments,
      spotlight: LIVE_BOARD_MOCK.spotlight,
      spotlightTotal: LIVE_BOARD_MOCK.spotlightTotal,
      stats: LIVE_BOARD_MOCK.stats,
      giftLeaderboard: LIVE_BOARD_MOCK.giftLeaderboard,
      rankLeaderboard: LIVE_BOARD_MOCK.rankLeaderboard,
    };
  }
}
