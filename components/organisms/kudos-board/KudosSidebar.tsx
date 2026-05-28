'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { GiftIcon, HeartIcon } from '@/components/atoms/KudoIcons';
import { SecretBoxDialog } from '@/components/molecules/kudos-board/SecretBoxDialog';
import { SidebarStatRow } from '@/components/molecules/kudos-board/SidebarStatRow';
import { SunnerLeaderboardRow } from '@/components/molecules/kudos-board/SunnerLeaderboardRow';
import { useUserStats } from '@/lib/kudos/queries/useUserStats';
import type { LeaderboardEntry, UserKudoStats } from '@/lib/kudos/types';

interface KudosSidebarProps {
  /** Null when the viewer is anonymous — personal-stats block is hidden (FR-016). */
  stats: UserKudoStats | null;
  giftLeaderboard: readonly LeaderboardEntry[];
  rankLeaderboard: readonly LeaderboardEntry[];
}

/**
 * Right-hand sidebar (`D_Thống menu phải`). Personal counters at the top
 * (auth-only) — refetched after every like via `useUserStats` — `Mở quà`
 * CTA in the middle, two mini-leaderboards below.
 */
export function KudosSidebar({
  stats: initialStats,
  giftLeaderboard,
  rankLeaderboard,
}: KudosSidebarProps) {
  const t = useTranslations('kudos.live.sidebar');
  const tStats = useTranslations('kudos.live.sidebar.stats');
  const tLb = useTranslations('kudos.live.sidebar.leaderboard');
  const [boxDialogOpen, setBoxDialogOpen] = useState(false);
  const [pendingBox, setPendingBox] = useState(false);

  const { data: stats } = useUserStats(initialStats);
  const boxDisabled = !stats || stats.secretBoxesUnopened === 0;

  async function handleOpenBox() {
    if (boxDisabled || pendingBox) return;
    setPendingBox(true);
    try {
      // Best-effort fetch the next box id — placeholder dialog ignores the
      // payload but the round-trip matches the production contract.
      await fetch('/api/secret-boxes/next-unopened').catch(() => null);
      setBoxDialogOpen(true);
    } finally {
      setPendingBox(false);
    }
  }

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[320px]">
      {stats ? (
        <div className="rounded-2xl border border-hero-foreground/15 bg-white/5 p-5">
          <div className="divide-y divide-hero-foreground/10">
            <SidebarStatRow label={tStats('kudosReceived')} value={stats.kudosReceived} />
            <SidebarStatRow label={tStats('kudosSent')} value={stats.kudosSent} />
            <SidebarStatRow
              label={tStats('heartsReceived')}
              value={stats.heartsReceived}
              icon={<HeartIcon filled className="h-4 w-4 text-[#D4271D]" />}
            />
            <SidebarStatRow label={tStats('secretBoxesOpened')} value={stats.secretBoxesOpened} />
            <SidebarStatRow
              label={tStats('secretBoxesUnopened')}
              value={stats.secretBoxesUnopened}
            />
          </div>
          <button
            type="button"
            onClick={handleOpenBox}
            disabled={boxDisabled || pendingBox}
            aria-disabled={boxDisabled}
            aria-haspopup="dialog"
            title={boxDisabled ? t('openBoxDisabledTooltip') : undefined}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FFEA9E] py-3 text-sm font-extrabold uppercase tracking-wide text-foreground transition hover:bg-[#FFE074] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GiftIcon className="h-5 w-5" />
            {t('openBox')}
          </button>
        </div>
      ) : null}

      <LeaderboardCard
        title={tLb('giftRecipients')}
        emptyText={tLb('empty')}
        entries={giftLeaderboard}
      />

      <LeaderboardCard
        title={tLb('rankPromotions')}
        emptyText={tLb('empty')}
        entries={rankLeaderboard}
      />

      {boxDialogOpen ? <SecretBoxDialog onClose={() => setBoxDialogOpen(false)} /> : null}
    </aside>
  );
}

interface LeaderboardCardProps {
  title: string;
  emptyText: string;
  entries: readonly LeaderboardEntry[];
}

function LeaderboardCard({ title, emptyText, entries }: LeaderboardCardProps) {
  return (
    <div className="rounded-2xl border border-hero-foreground/15 bg-white/5 p-5">
      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#FFEA9E]">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-xs text-hero-foreground/60">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-hero-foreground/10">
          {entries.map((entry) => (
            <li key={entry.userId}>
              <SunnerLeaderboardRow entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
