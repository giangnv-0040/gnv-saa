import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KudoCard } from '@/components/molecules/kudos-board/KudoCard';
import { wrapKudos } from '@/tests/helpers/render-kudos';
import type { Kudo } from '@/lib/kudos/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/kudos',
}));

const KUDO: Kudo = {
  id: '11111111-1111-4111-9111-111111111111',
  sender: {
    id: 'u-sender',
    displayName: 'Sender Name',
    team: 'TeamA',
    badge: 'Rising Hero',
    heartsReceived: 12,
    avatarUrl: null,
  },
  recipient: {
    id: 'u-recipient',
    displayName: 'Recipient Name',
    team: 'TeamB',
    badge: null,
    heartsReceived: 5,
    avatarUrl: null,
  },
  title: 'IDOL',
  body: 'Body content goes here.',
  hashtags: ['dedicated', 'inspring'],
  imageUrls: ['/a.png', '/b.png'],
  heartsCount: 7,
  viewerHasLiked: false,
  createdAt: '2026-05-20T10:00:00.000Z',
};

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ heartsCount: 8 }), { status: 200 }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<KudoCard>', () => {
  it('wraps the title + body in a link to the kudo detail page', () => {
    render(wrapKudos(<KudoCard kudo={KUDO} variant="feed" />));
    const link = screen.getAllByRole('link', { name: /Xem chi tiết Kudo/i })[0]!;
    expect(link).toHaveAttribute('href', `/kudos/${encodeURIComponent(KUDO.id)}`);
  });

  it('disables the heart button when the viewer authored the kudo', () => {
    render(wrapKudos(<KudoCard kudo={KUDO} variant="feed" viewerId={KUDO.sender.id} />));
    const heart = screen.getByRole('button', { name: /Thả tim cho Kudo|Bỏ thả tim/ });
    expect(heart).toBeDisabled();
    expect(heart).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders hashtag chips as filtering links', () => {
    render(wrapKudos(<KudoCard kudo={KUDO} variant="feed" />));
    const chip = screen.getByRole('link', { name: '#dedicated' });
    expect(chip).toHaveAttribute('href', '/kudos?hashtag=dedicated');
  });

  it('shows the image gallery in the feed variant only', () => {
    const { container, rerender } = render(wrapKudos(<KudoCard kudo={KUDO} variant="feed" />));
    const galleryImgs = container.querySelectorAll('img[src="/a.png"], img[src="/b.png"]');
    expect(galleryImgs.length).toBe(2);

    rerender(wrapKudos(<KudoCard kudo={KUDO} variant="highlight" />));
    const galleryImgsAfter = container.querySelectorAll('img[src="/a.png"], img[src="/b.png"]');
    expect(galleryImgsAfter.length).toBe(0);
  });
});
