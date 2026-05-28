import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HighlightCarousel } from '@/components/organisms/kudos-board/HighlightCarousel';
import { wrapKudos } from '@/tests/helpers/render-kudos';
import type { Kudo, KudoFilterOption } from '@/lib/kudos/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/kudos',
}));

function mkKudo(id: string, heartsCount: number, sender = 'A', recipient = 'B'): Kudo {
  return {
    id,
    sender: {
      id: `u-${sender}`,
      displayName: sender,
      team: 'X',
      badge: null,
      heartsReceived: 0,
      avatarUrl: null,
    },
    recipient: {
      id: `u-${recipient}`,
      displayName: recipient,
      team: 'Y',
      badge: null,
      heartsReceived: 0,
      avatarUrl: null,
    },
    title: null,
    body: 'body',
    hashtags: [],
    imageUrls: [],
    heartsCount,
    viewerHasLiked: false,
    createdAt: '2026-05-20T10:00:00.000Z',
  };
}

const HASHTAGS: readonly KudoFilterOption[] = [{ value: 'a', label: '#A' }];
const TEAMS: readonly KudoFilterOption[] = [{ value: 'x', label: 'X' }];
const INITIAL: readonly Kudo[] = [
  mkKudo('11111111-1111-4111-9111-111111111111', 100),
  mkKudo('22222222-2222-4222-9222-222222222222', 90),
  mkKudo('33333333-3333-4333-9333-333333333333', 80),
];

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ items: INITIAL }), { status: 200 }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<HighlightCarousel>', () => {
  it('disables the prev arrow on the first slide (US5)', () => {
    render(
      wrapKudos(
        <HighlightCarousel initial={INITIAL} hashtagOptions={HASHTAGS} departmentOptions={TEAMS} />,
      ),
    );
    const prev = screen.getAllByRole('button', { name: 'Kudo trước' })[0]!;
    expect(prev).toBeDisabled();
  });

  it('advances the indicator on Next and toggles button-disabled states', async () => {
    render(
      wrapKudos(
        <HighlightCarousel initial={INITIAL} hashtagOptions={HASHTAGS} departmentOptions={TEAMS} />,
      ),
    );
    expect(screen.getByText('1/3')).toBeInTheDocument();
    const next = screen.getAllByRole('button', { name: 'Kudo tiếp' })[0]!;
    await userEvent.click(next);
    expect(screen.getByText('2/3')).toBeInTheDocument();
    await userEvent.click(next);
    expect(screen.getByText('3/3')).toBeInTheDocument();
    // At end → next disabled.
    const lastNext = screen.getAllByRole('button', { name: 'Kudo tiếp' })[0]!;
    expect(lastNext).toBeDisabled();
  });

  it('renders the empty-state copy when no kudos match', () => {
    render(
      wrapKudos(
        <HighlightCarousel initial={[]} hashtagOptions={HASHTAGS} departmentOptions={TEAMS} />,
      ),
    );
    expect(screen.getByText('Không có kudo nào khớp bộ lọc.')).toBeInTheDocument();
  });
});
