import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KudosSidebar } from '@/components/organisms/kudos-board/KudosSidebar';
import { wrapKudos } from '@/tests/helpers/render-kudos';
import type { LeaderboardEntry, UserKudoStats } from '@/lib/kudos/types';

const STATS: UserKudoStats = {
  kudosReceived: 5,
  kudosSent: 3,
  heartsReceived: 12,
  secretBoxesOpened: 1,
  secretBoxesUnopened: 2,
};

const GIFT_LB: readonly LeaderboardEntry[] = [
  {
    userId: 'u-1',
    displayName: 'Sunner A',
    team: 'Mobile',
    kind: 'gift',
    note: 'Áo phòng SAA',
    avatarUrl: null,
  },
];

const RANK_LB: readonly LeaderboardEntry[] = [
  {
    userId: 'u-2',
    displayName: 'Sunner B',
    team: 'Design',
    kind: 'rank-promotion',
    note: 'Rising Hero',
    avatarUrl: null,
  },
];

describe('<KudosSidebar>', () => {
  it('hides the personal-stats block when stats is null (FR-016 anonymous)', () => {
    render(
      wrapKudos(<KudosSidebar stats={null} giftLeaderboard={GIFT_LB} rankLeaderboard={RANK_LB} />),
    );
    expect(screen.queryByText(/Số Kudos bạn nhận được/)).toBeNull();
    expect(screen.getByText(/10 SUNNER NHẬN QUÀ MỚI NHẤT/)).toBeInTheDocument();
    expect(screen.getByText(/10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT/)).toBeInTheDocument();
  });

  it('renders stat rows + Mở quà enabled when boxes unopened > 0', () => {
    render(
      wrapKudos(<KudosSidebar stats={STATS} giftLeaderboard={GIFT_LB} rankLeaderboard={RANK_LB} />),
    );
    expect(screen.getByText(/Số Kudos bạn nhận được/)).toBeInTheDocument();
    const openBtn = screen.getByRole('button', { name: /Mở Secret Box/i });
    expect(openBtn).not.toBeDisabled();
  });

  it('disables Mở quà when no unopened boxes', () => {
    render(
      wrapKudos(
        <KudosSidebar
          stats={{ ...STATS, secretBoxesUnopened: 0 }}
          giftLeaderboard={[]}
          rankLeaderboard={[]}
        />,
      ),
    );
    const openBtn = screen.getByRole('button', { name: /Mở Secret Box/i });
    expect(openBtn).toBeDisabled();
    expect(openBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows "Chưa có dữ liệu" for empty leaderboards', () => {
    render(wrapKudos(<KudosSidebar stats={null} giftLeaderboard={[]} rankLeaderboard={[]} />));
    expect(screen.getAllByText('Chưa có dữ liệu').length).toBe(2);
  });
});
