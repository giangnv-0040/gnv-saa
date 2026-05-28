import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/lib/routes';
import type { LeaderboardEntry } from '@/lib/kudos/types';

interface SunnerLeaderboardRowProps {
  entry: LeaderboardEntry;
}

/**
 * Sidebar leaderboard row. Localises the note in the active locale (FR-018)
 * based on `entry.kind` — the server emits raw payloads (gift SKU / badge
 * name); this component wraps them in a translated template.
 */
export function SunnerLeaderboardRow({ entry }: SunnerLeaderboardRowProps) {
  const t = useTranslations('kudos.live.sidebar.leaderboard');
  const note =
    entry.kind === 'rank-promotion'
      ? t('rankPromotionNote', { badge: entry.note })
      : t('giftNote', { gift: entry.note });
  return (
    <Link
      href={`${ROUTES.PROFILE}/${entry.userId}`}
      className="flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-white/5"
    >
      <span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-xs font-bold text-hero-foreground"
      >
        {entry.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          entry.displayName.slice(0, 1)
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-hero-foreground">
          {entry.displayName}
        </span>
        <span className="block truncate text-xs text-hero-foreground/60">{note}</span>
      </span>
    </Link>
  );
}
