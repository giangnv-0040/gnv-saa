import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SunnerLeaderboardRow } from '@/components/molecules/kudos-board/SunnerLeaderboardRow';
import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';
import jaMessages from '@/messages/ja.json';
import type { LeaderboardEntry } from '@/lib/kudos/types';

const RANK_ENTRY: LeaderboardEntry = {
  userId: 'u-1',
  displayName: 'Sunner A',
  team: 'Design',
  kind: 'rank-promotion',
  note: 'Legend Hero',
  avatarUrl: null,
};

const GIFT_ENTRY: LeaderboardEntry = {
  userId: 'u-2',
  displayName: 'Sunner B',
  team: 'Mobile',
  kind: 'gift',
  note: 'Áo phòng SAA',
  avatarUrl: null,
};

function wrap(ui: React.ReactNode, locale: 'vi' | 'en' | 'ja', messages: object) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<SunnerLeaderboardRow> — FR-018 localization', () => {
  it('formats rank-promotion note via next-intl in VI', () => {
    render(wrap(<SunnerLeaderboardRow entry={RANK_ENTRY} />, 'vi', viMessages));
    expect(screen.getByText('Lên hạng Legend Hero')).toBeInTheDocument();
  });

  it('formats rank-promotion note in EN', () => {
    render(wrap(<SunnerLeaderboardRow entry={RANK_ENTRY} />, 'en', enMessages));
    expect(screen.getByText('Promoted to Legend Hero')).toBeInTheDocument();
  });

  it('formats rank-promotion note in JA', () => {
    render(wrap(<SunnerLeaderboardRow entry={RANK_ENTRY} />, 'ja', jaMessages));
    expect(screen.getByText('Legend Heroへ昇格')).toBeInTheDocument();
  });

  it('formats gift note via next-intl in VI', () => {
    render(wrap(<SunnerLeaderboardRow entry={GIFT_ENTRY} />, 'vi', viMessages));
    expect(screen.getByText('Nhận được Áo phòng SAA')).toBeInTheDocument();
  });

  it('formats gift note in EN', () => {
    render(wrap(<SunnerLeaderboardRow entry={GIFT_ENTRY} />, 'en', enMessages));
    expect(screen.getByText('Received Áo phòng SAA')).toBeInTheDocument();
  });
});
